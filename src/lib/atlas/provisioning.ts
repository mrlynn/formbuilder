/**
 * Atlas Cluster Provisioning Service
 *
 * Handles the complete flow of provisioning an M0 cluster for a new organization:
 * 1. Create Atlas project
 * 2. Create M0 cluster
 * 3. Create database user
 * 4. Configure network access
 * 5. Store connection in vault
 */

import { ObjectId } from 'mongodb';
import { getAtlasClient } from './client';
import {
  ProvisionClusterOptions,
  ProvisioningResult,
  ProvisioningStatus,
  ProvisionedCluster,
  ClusterBackingProvider,
  M0Region,
} from './types';
import { createConnectionVault } from '../platform/connectionVault';
import { getPlatformDb, getOrgDb } from '../platform/db';

// ============================================
// Configuration
// ============================================

const ATLAS_ORG_ID = process.env.ATLAS_ORG_ID || '';
const DEFAULT_PROVIDER = (process.env.ATLAS_DEFAULT_PROVIDER || 'AWS') as ClusterBackingProvider;
const DEFAULT_REGION = (process.env.ATLAS_DEFAULT_REGION || 'US_EAST_1') as M0Region;
const SERVER_IPS = process.env.ATLAS_SERVER_IPS?.split(',').filter(Boolean) || [];

// Log configuration at startup
console.log('[Atlas Provisioning] Configuration:', {
  orgId: ATLAS_ORG_ID ? `${ATLAS_ORG_ID.slice(0, 8)}...` : 'NOT SET',
  provider: DEFAULT_PROVIDER,
  region: DEFAULT_REGION,
  hasPublicKey: !!process.env.ATLAS_PUBLIC_KEY,
  hasPrivateKey: !!process.env.ATLAS_PRIVATE_KEY,
});

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a secure random password
 */
function generateSecurePassword(length: number = 24): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

/**
 * Generate a unique cluster name
 */
function generateClusterName(orgId: string): string {
  const suffix = orgId.slice(-6);
  return `forms-${suffix}`;
}

/**
 * Generate a database username
 */
function generateDbUsername(orgId: string): string {
  const suffix = orgId.slice(-8);
  return `formbuilder-${suffix}`;
}

/**
 * Build the connection string from cluster and user info
 */
function buildConnectionString(
  clusterSrvHost: string,
  username: string,
  password: string,
  database: string
): string {
  // The cluster.connectionStrings.standardSrv looks like: mongodb+srv://cluster.xxx.mongodb.net
  // We need to inject the username:password
  const encodedUsername = encodeURIComponent(username);
  const encodedPassword = encodeURIComponent(password);

  // Extract the host from the SRV connection string
  const hostMatch = clusterSrvHost.match(/mongodb\+srv:\/\/(.+)/);
  const host = hostMatch ? hostMatch[1] : clusterSrvHost;

  return `mongodb+srv://${encodedUsername}:${encodedPassword}@${host}/${database}?retryWrites=true&w=majority`;
}

// ============================================
// Provisioned Cluster Collection Operations
// ============================================

async function getProvisionedClustersCollection() {
  const db = await getPlatformDb();
  return db.collection<ProvisionedCluster>('provisioned_clusters');
}

/**
 * Create a new provisioned cluster record
 */
async function createProvisionedClusterRecord(
  data: Omit<ProvisionedCluster, '_id' | 'clusterId' | 'createdAt' | 'updatedAt'>
): Promise<ProvisionedCluster> {
  const collection = await getProvisionedClustersCollection();

  const clusterId = `cluster_${new ObjectId().toHexString()}`;
  const now = new Date();

  const record: ProvisionedCluster = {
    ...data,
    clusterId,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(record);
  return record;
}

/**
 * Update provisioned cluster status
 */
async function updateProvisionedClusterStatus(
  clusterId: string,
  status: ProvisioningStatus,
  updates: Partial<ProvisionedCluster> = {}
): Promise<void> {
  const collection = await getProvisionedClustersCollection();

  await collection.updateOne(
    { clusterId },
    {
      $set: {
        status,
        ...updates,
        updatedAt: new Date(),
      },
    }
  );
}

/**
 * Get provisioned cluster for an organization
 */
export async function getProvisionedClusterForOrg(
  organizationId: string
): Promise<ProvisionedCluster | null> {
  const collection = await getProvisionedClustersCollection();
  return collection.findOne({
    organizationId,
    status: { $nin: ['deleted', 'failed'] },
  });
}

/**
 * Get all provisioned clusters (admin use)
 */
export async function getAllProvisionedClusters(): Promise<ProvisionedCluster[]> {
  const collection = await getProvisionedClustersCollection();
  return collection.find({}).sort({ createdAt: -1 }).toArray();
}

// ============================================
// Main Provisioning Function
// ============================================

/**
 * Provision a new M0 cluster for an organization
 *
 * This is the main entry point for cluster provisioning.
 * It handles the complete flow and tracks progress.
 */
export async function provisionM0Cluster(
  options: ProvisionClusterOptions
): Promise<ProvisioningResult> {
  console.log('[Provisioning] Starting M0 cluster provisioning for org:', options.organizationId);

  const client = getAtlasClient();

  // Check if Atlas API is configured
  if (!client.isConfigured()) {
    console.error('[Provisioning] Atlas API not configured!', {
      hasPublicKey: !!process.env.ATLAS_PUBLIC_KEY,
      hasPrivateKey: !!process.env.ATLAS_PRIVATE_KEY,
    });
    return {
      success: false,
      status: 'failed',
      error: 'Atlas API not configured. Set ATLAS_PUBLIC_KEY and ATLAS_PRIVATE_KEY.',
    };
  }

  if (!ATLAS_ORG_ID) {
    console.error('[Provisioning] ATLAS_ORG_ID not configured!');
    return {
      success: false,
      status: 'failed',
      error: 'Atlas organization ID not configured. Set ATLAS_ORG_ID.',
    };
  }

  console.log('[Provisioning] Configuration validated, proceeding with Atlas org:', ATLAS_ORG_ID);

  const {
    organizationId,
    userId,
    clusterName = generateClusterName(organizationId),
    provider = DEFAULT_PROVIDER,
    region = DEFAULT_REGION,
    databaseName = 'forms',
  } = options;

  // Check if org already has a cluster
  const existingCluster = await getProvisionedClusterForOrg(organizationId);
  if (existingCluster) {
    return {
      success: false,
      status: existingCluster.status,
      clusterId: existingCluster.clusterId,
      vaultId: existingCluster.vaultId,
      error: 'Organization already has a provisioned cluster',
    };
  }

  // Create initial tracking record
  const projectName = `formbuilder-${organizationId.slice(-8)}`;
  const clusterRecord = await createProvisionedClusterRecord({
    organizationId,
    atlasProjectId: '',
    atlasProjectName: projectName,
    atlasClusterName: clusterName,
    provider,
    region,
    instanceSize: 'M0',
    status: 'pending',
    provisioningStartedAt: new Date(),
    storageLimitMb: 512,
    maxConnections: 500,
    createdBy: userId,
  });

  try {
    // Step 1: Create Atlas Project
    console.log(`[Provisioning] Creating Atlas project: ${projectName}`);
    await updateProvisionedClusterStatus(clusterRecord.clusterId, 'creating_project');

    const projectResult = await client.createProject({
      name: projectName,
      orgId: ATLAS_ORG_ID,
    });

    console.log('[Provisioning] Project creation result:', JSON.stringify(projectResult, null, 2));
    if (!projectResult.success) {
      throw new Error(projectResult.error?.detail || 'Failed to create Atlas project');
    }

    if (!projectResult.data) {
      throw new Error('Atlas API returned success but no project data');
    }

    // Atlas API may return 'id' or 'groupId' for the project ID
    const atlasProjectId = projectResult.data.id || (projectResult.data as any).groupId;
    if (!atlasProjectId) {
      console.error('[Provisioning] Project data missing ID:', projectResult.data);
      throw new Error('Atlas project created but no project ID returned');
    }

    console.log('[Provisioning] Created Atlas project with ID:', atlasProjectId);
    await updateProvisionedClusterStatus(clusterRecord.clusterId, 'creating_project', {
      atlasProjectId,
    });

    // Step 2: Create M0 Cluster
    console.log(`[Provisioning] Creating M0 cluster: ${clusterName}`);
    await updateProvisionedClusterStatus(clusterRecord.clusterId, 'creating_cluster');

    // M0 free tier clusters use the providerSettings format (not replicationSpecs)
    const clusterInput = {
      name: clusterName,
      providerSettings: {
        providerName: 'TENANT' as const,
        backingProviderName: provider,
        regionName: region,
        instanceSizeName: 'M0' as const,
      },
    };
    console.log('[Provisioning] Cluster creation input:', JSON.stringify(clusterInput, null, 2));

    const clusterResult = await client.createM0Cluster(atlasProjectId, clusterInput);

    if (!clusterResult.success || !clusterResult.data) {
      throw new Error(clusterResult.error?.detail || 'Failed to create M0 cluster');
    }

    const atlasClusterId = clusterResult.data.id;
    await updateProvisionedClusterStatus(clusterRecord.clusterId, 'creating_cluster', {
      atlasClusterId,
    });

    // Step 3: Wait for cluster to be ready
    console.log('[Provisioning] Waiting for cluster to be ready...');
    const readyResult = await client.waitForClusterReady(atlasProjectId, clusterName, 120000);

    if (!readyResult.success || !readyResult.data) {
      throw new Error(readyResult.error?.detail || 'Cluster did not become ready');
    }

    const connectionStringSrv = readyResult.data.connectionStrings?.standardSrv;
    if (!connectionStringSrv) {
      throw new Error('Cluster ready but no connection string available');
    }

    // Step 4: Create Database User
    console.log('[Provisioning] Creating database user');
    await updateProvisionedClusterStatus(clusterRecord.clusterId, 'creating_user');

    const dbUsername = generateDbUsername(organizationId);
    const dbPassword = generateSecurePassword();

    const userResult = await client.createDatabaseUser(atlasProjectId, {
      username: dbUsername,
      password: dbPassword,
      roles: [
        {
          roleName: 'readWrite',
          databaseName: databaseName,
        },
      ],
      scopes: [
        {
          name: clusterName,
          type: 'CLUSTER',
        },
      ],
    });

    if (!userResult.success) {
      throw new Error(userResult.error?.detail || 'Failed to create database user');
    }

    await updateProvisionedClusterStatus(clusterRecord.clusterId, 'creating_user', {
      databaseUsername: dbUsername,
    });

    // Step 5: Configure Network Access
    console.log('[Provisioning] Configuring network access');
    await updateProvisionedClusterStatus(clusterRecord.clusterId, 'configuring_network');

    if (SERVER_IPS.length > 0) {
      // Add specific server IPs
      const ipEntries = SERVER_IPS.map((ip) => ({
        ipAddress: ip.trim(),
        comment: 'FormBuilder server',
      }));
      await client.addIpAccessListEntries(atlasProjectId, ipEntries);
    } else {
      // Allow all IPs (for development/simplicity)
      await client.allowAllIps(atlasProjectId, 'FormBuilder - Allow all (provisioned cluster)');
    }

    // Step 6: Build connection string and store in vault
    console.log('[Provisioning] Storing connection in vault');
    const connectionString = buildConnectionString(
      connectionStringSrv,
      dbUsername,
      dbPassword,
      databaseName
    );

    const vault = await createConnectionVault({
      organizationId,
      createdBy: 'system',
      name: 'Default Database (Auto-provisioned)',
      description: `M0 cluster automatically provisioned on ${new Date().toLocaleDateString()}`,
      connectionString,
      database: databaseName,
      allowedCollections: [], // Allow all collections
    });

    // Step 7: Mark as ready
    await updateProvisionedClusterStatus(clusterRecord.clusterId, 'ready', {
      vaultId: vault.vaultId,
      provisioningCompletedAt: new Date(),
    });

    console.log(`[Provisioning] Successfully provisioned cluster for org ${organizationId}`);

    return {
      success: true,
      clusterId: clusterRecord.clusterId,
      vaultId: vault.vaultId,
      connectionString: '[REDACTED]', // Never expose connection string
      status: 'ready',
    };
  } catch (error: any) {
    console.error('[Provisioning] Error:', error);

    await updateProvisionedClusterStatus(clusterRecord.clusterId, 'failed', {
      statusMessage: error.message,
    });

    return {
      success: false,
      clusterId: clusterRecord.clusterId,
      status: 'failed',
      error: error.message,
    };
  }
}

// ============================================
// Background Provisioning
// ============================================

/**
 * Queue cluster provisioning to run in background
 *
 * This is useful when you don't want to block the user during signup.
 * The provisioning will happen asynchronously and the user can check status.
 */
export async function queueClusterProvisioning(
  options: ProvisionClusterOptions
): Promise<{ clusterId: string; status: ProvisioningStatus }> {
  console.log('[Provisioning] Queueing cluster provisioning for org:', options.organizationId);

  const client = getAtlasClient();

  // Check if Atlas API is configured
  if (!client.isConfigured()) {
    console.error('[Provisioning] Queue failed - Atlas API not configured');
    return {
      clusterId: '',
      status: 'failed',
    };
  }

  // Start provisioning directly (provisionM0Cluster handles record creation)
  // Run in background but log errors
  console.log('[Provisioning] Starting background provisioning...');
  provisionM0Cluster(options)
    .then((result) => {
      console.log('[Provisioning] Background provisioning completed:', result);
    })
    .catch((err) => {
      console.error('[Provisioning] Background provisioning failed:', err);
    });

  return {
    clusterId: 'pending',
    status: 'pending',
  };
}

// ============================================
// Cluster Management
// ============================================

/**
 * Get provisioning status for an organization
 */
export async function getProvisioningStatus(
  organizationId: string
): Promise<{ status: ProvisioningStatus; message?: string; vaultId?: string } | null> {
  const cluster = await getProvisionedClusterForOrg(organizationId);

  if (!cluster) {
    return null;
  }

  return {
    status: cluster.status,
    message: cluster.statusMessage,
    vaultId: cluster.vaultId,
  };
}

/**
 * Check if auto-provisioning is available
 */
export function isAutoProvisioningAvailable(): boolean {
  const client = getAtlasClient();
  return client.isConfigured() && !!ATLAS_ORG_ID;
}

/**
 * Delete a provisioned cluster (cleanup)
 */
export async function deleteProvisionedCluster(
  organizationId: string,
  deletedBy: string
): Promise<{ success: boolean; error?: string }> {
  const cluster = await getProvisionedClusterForOrg(organizationId);

  if (!cluster) {
    return { success: false, error: 'No provisioned cluster found' };
  }

  const client = getAtlasClient();

  try {
    // Delete the cluster from Atlas
    if (cluster.atlasProjectId && cluster.atlasClusterName) {
      await client.deleteCluster(cluster.atlasProjectId, cluster.atlasClusterName);
    }

    // Delete the project
    if (cluster.atlasProjectId) {
      await client.deleteProject(cluster.atlasProjectId);
    }

    // Mark as deleted
    await updateProvisionedClusterStatus(cluster.clusterId, 'deleted', {
      deletedAt: new Date(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('[Provisioning] Error deleting cluster:', error);
    return { success: false, error: error.message };
  }
}
