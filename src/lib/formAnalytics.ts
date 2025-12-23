import { MongoClient } from 'mongodb';
import { FormResponse, FormAnalytics, FieldStatistics, FieldConfig, FormSubmission, FieldDropOffStats, FormDropOffAnalytics, FieldInteractionData } from '@/types/form';
import { calculateFieldStats } from './fieldAnalytics';
import { getGlobalSubmissionsForForm } from './storage';
import { listFormSubmissions } from './platform/submissions';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'form_builder';

interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * Calculate completion rate from responses
 */
export function calculateCompletionRate(responses: FormResponse[]): number {
  if (responses.length === 0) return 0;
  
  const completed = responses.filter(r => r.status === 'submitted').length;
  return (completed / responses.length) * 100;
}

/**
 * Calculate average completion time
 */
export function calculateAverageTime(responses: FormResponse[]): number {
  const times = responses
    .map(r => r.completionTime)
    .filter((t): t is number => t !== null && t !== undefined);
  
  if (times.length === 0) return 0;
  
  return times.reduce((a, b) => a + b, 0) / times.length;
}

/**
 * Calculate response trend over time
 */
export function detectTrends(
  responses: FormResponse[],
  timeRange?: TimeRange
): Array<{ date: string; count: number }> {
  const filtered = timeRange
    ? responses.filter(r => {
        const date = new Date(r.submittedAt);
        return date >= timeRange.start && date <= timeRange.end;
      })
    : responses;

  // Group by date
  const dateCounts: Record<string, number> = {};
  
  filtered.forEach(response => {
    const date = new Date(response.submittedAt);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
  });

  // Convert to array and sort
  return Object.entries(dateCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate device breakdown
 */
export function calculateDeviceBreakdown(
  responses: FormResponse[]
): Record<string, number> {
  const breakdown: Record<string, number> = {
    mobile: 0,
    desktop: 0,
    tablet: 0,
    unknown: 0,
  };

  responses.forEach(response => {
    const deviceType = response.metadata?.deviceType || 'unknown';
    breakdown[deviceType] = (breakdown[deviceType] || 0) + 1;
  });

  return breakdown;
}

/**
 * Calculate overall form statistics
 */
export function calculateFormStats(
  formId: string,
  responses: FormResponse[]
): {
  totalResponses: number;
  completionRate: number;
  averageCompletionTime: number;
  responseTrend: Array<{ date: string; count: number }>;
  deviceBreakdown: Record<string, number>;
} {
  return {
    totalResponses: responses.length,
    completionRate: calculateCompletionRate(responses),
    averageCompletionTime: calculateAverageTime(responses),
    responseTrend: detectTrends(responses),
    deviceBreakdown: calculateDeviceBreakdown(responses),
  };
}

/**
 * Convert FormSubmission to FormResponse for analytics calculations
 */
function submissionToResponse(submission: FormSubmission): FormResponse {
  return {
    _id: submission.id,
    formId: submission.formId,
    formVersion: submission.formVersion || 1,
    data: submission.data,
    status: submission.status,
    submittedAt: new Date(submission.submittedAt),
    startedAt: submission.startedAt ? new Date(submission.startedAt) : undefined,
    completedAt: submission.completedAt ? new Date(submission.completedAt) : undefined,
    completionTime: submission.completionTime,
    metadata: {
      userAgent: submission.metadata?.userAgent,
      ipAddress: submission.metadata?.ipAddress,
      referrer: submission.metadata?.referrer,
      deviceType: submission.metadata?.deviceType,
    },
  };
}

/**
 * Calculate comprehensive analytics for a form
 */
export async function calculateFormAnalytics(
  formId: string,
  fieldConfigs: FieldConfig[],
  timeRange?: TimeRange,
  connectionString?: string,
  organizationId?: string
): Promise<FormAnalytics> {
  let responses: FormResponse[] = [];

  // First, try to get submissions from platform database (production mode)
  if (organizationId) {
    try {
      const { submissions } = await listFormSubmissions(organizationId, formId, { limit: 10000 });
      const platformResponses = submissions.map(sub => ({
        _id: sub.submissionId,
        formId: sub.formId,
        formVersion: sub.formVersion,
        data: sub.data as Record<string, unknown>,
        status: 'submitted' as const,
        submittedAt: new Date(sub.submittedAt),
        metadata: {
          userAgent: sub.metadata?.userAgent,
          ipAddress: sub.metadata?.ipAddress,
          referrer: sub.metadata?.referrer,
          deviceType: sub.metadata?.deviceType,
        },
      }));
      responses = platformResponses;
    } catch (err) {
      console.error('Error loading submissions from platform:', err);
    }
  }

  // Also try to get submissions from global file storage (legacy mode)
  try {
    const fileSubmissions = await getGlobalSubmissionsForForm(formId);
    const fileResponses = fileSubmissions.map(submissionToResponse);

    // Merge with platform responses, avoiding duplicates by ID
    const existingIds = new Set(responses.map(r => r._id));
    for (const fileResponse of fileResponses) {
      if (!existingIds.has(fileResponse._id)) {
        responses.push(fileResponse);
      }
    }
  } catch (err) {
    console.error('Error loading submissions from file storage:', err);
  }

  // If we have a MongoDB connection, also fetch from there and merge
  const mongoUri = connectionString || MONGODB_URI;
  if (mongoUri) {
    const client = new MongoClient(mongoUri);
    try {
      await client.connect();
      const db = client.db(MONGODB_DATABASE);
      const collection = db.collection<FormResponse>('form_responses');

      // Build query
      const query: any = { formId };
      if (timeRange) {
        query.submittedAt = {
          $gte: timeRange.start,
          $lte: timeRange.end,
        };
      }

      const mongoResponses = await collection.find(query).toArray();

      // Merge with existing responses, avoiding duplicates by ID
      const existingIds = new Set(responses.map(r => r._id));
      for (const mongoResponse of mongoResponses) {
        const mongoId = mongoResponse._id?.toString();
        if (!existingIds.has(mongoId)) {
          responses.push({ ...mongoResponse, _id: mongoId });
        }
      }
    } catch (err) {
      console.error('Error loading submissions from MongoDB:', err);
      // Continue with existing responses if MongoDB fails
    } finally {
      await client.close();
    }
  }

  // Apply time range filter to all responses
  if (timeRange) {
    responses = responses.filter(r => {
      const date = new Date(r.submittedAt);
      return date >= timeRange.start && date <= timeRange.end;
    });
  }

  // Calculate overall stats
  const formStats = calculateFormStats(formId, responses);

  // Calculate field-level stats
  const fieldStats: Record<string, FieldStatistics> = {};

  const includedFields = fieldConfigs.filter(f => f.included);
  includedFields.forEach(field => {
    fieldStats[field.path] = calculateFieldStats(field, responses);
  });

  return {
    formId,
    totalResponses: formStats.totalResponses,
    completionRate: formStats.completionRate,
    averageCompletionTime: formStats.averageCompletionTime,
    responseTrend: formStats.responseTrend,
    fieldStats,
    deviceBreakdown: formStats.deviceBreakdown,
    timeRange: timeRange || {
      start: responses.length > 0
        ? new Date(Math.min(...responses.map(r => new Date(r.submittedAt).getTime())))
        : new Date(),
      end: new Date(),
    },
    calculatedAt: new Date(),
  };
}

// ============================================
// Field Drop-off Analytics
// ============================================

/**
 * Represents a session's field interaction data for drop-off analysis
 */
interface SessionInteraction {
  sessionId: string;
  fieldInteractions: Record<string, FieldInteractionData>;
  completed: boolean;
  lastFieldPath?: string;
}

/**
 * Calculate drop-off statistics for a single field
 */
function calculateFieldDropOff(
  fieldPath: string,
  sessions: SessionInteraction[],
  fieldOrder: number,
  totalFields: number
): FieldDropOffStats {
  let viewCount = 0;
  let interactionCount = 0;
  let completionCount = 0;
  let abandonmentCount = 0;
  let totalTimeSpent = 0;
  let timeSpentCount = 0;

  sessions.forEach(session => {
    const interaction = session.fieldInteractions[fieldPath];

    if (interaction) {
      // User viewed this field
      if (interaction.firstViewedAt) {
        viewCount++;
      }

      // User interacted with this field
      if (interaction.firstFocusAt) {
        interactionCount++;
      }

      // User completed this field
      if (interaction.completed) {
        completionCount++;
      }

      // Track time spent
      if (interaction.totalFocusTime) {
        totalTimeSpent += interaction.totalFocusTime;
        timeSpentCount++;
      }
    }

    // Check if this was the last field interacted with before abandonment
    if (!session.completed && session.lastFieldPath === fieldPath) {
      abandonmentCount++;
    }
  });

  const totalSessions = sessions.length;
  const abandonmentRate = totalSessions > 0
    ? (abandonmentCount / totalSessions) * 100
    : 0;

  const averageTimeSpent = timeSpentCount > 0
    ? (totalTimeSpent / timeSpentCount) / 1000  // Convert ms to seconds
    : 0;

  return {
    viewCount,
    interactionCount,
    completionCount,
    abandonmentCount,
    abandonmentRate,
    averageTimeSpent,
  };
}

/**
 * Determine the last field a user interacted with before abandoning
 */
function findLastInteractedField(
  fieldInteractions: Record<string, FieldInteractionData>
): string | undefined {
  let lastField: string | undefined;
  let lastTime = 0;

  Object.entries(fieldInteractions).forEach(([fieldPath, interaction]) => {
    const interactionTime = interaction.lastBlurAt || interaction.firstFocusAt || 0;
    if (interactionTime > lastTime) {
      lastTime = interactionTime;
      lastField = fieldPath;
    }
  });

  return lastField;
}

/**
 * Calculate comprehensive drop-off analytics for a form
 * Uses field interaction data from submissions and drafts
 */
export function calculateFormDropOffAnalytics(
  formId: string,
  fieldConfigs: FieldConfig[],
  submissions: Array<{
    sessionId: string;
    fieldInteractions?: Record<string, FieldInteractionData>;
    status: 'submitted' | 'draft' | 'incomplete';
  }>
): FormDropOffAnalytics {
  // Get ordered list of included fields
  const orderedFields = fieldConfigs
    .filter(f => f.included)
    .map(f => f.path);

  // Convert submissions to session interactions
  const sessions: SessionInteraction[] = submissions
    .filter(s => s.fieldInteractions && Object.keys(s.fieldInteractions).length > 0)
    .map(s => ({
      sessionId: s.sessionId,
      fieldInteractions: s.fieldInteractions!,
      completed: s.status === 'submitted',
      lastFieldPath: s.status !== 'submitted'
        ? findLastInteractedField(s.fieldInteractions!)
        : undefined,
    }));

  // Calculate stats
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.completed).length;
  const abandonedSessions = totalSessions - completedSessions;

  // Calculate drop-off for each field
  const fieldDropOff: Record<string, FieldDropOffStats> = {};
  orderedFields.forEach((fieldPath, index) => {
    fieldDropOff[fieldPath] = calculateFieldDropOff(
      fieldPath,
      sessions,
      index,
      orderedFields.length
    );
  });

  // Calculate average completion time from completed sessions
  let totalCompletionTime = 0;
  let completionTimeCount = 0;
  sessions.forEach(session => {
    if (session.completed) {
      const interactions = Object.values(session.fieldInteractions);
      const totalTime = interactions.reduce(
        (sum, i) => sum + (i.totalFocusTime || 0),
        0
      );
      if (totalTime > 0) {
        totalCompletionTime += totalTime;
        completionTimeCount++;
      }
    }
  });

  const averageCompletionTime = completionTimeCount > 0
    ? (totalCompletionTime / completionTimeCount) / 1000  // Convert to seconds
    : 0;

  return {
    formId,
    totalSessions,
    completedSessions,
    abandonedSessions,
    averageCompletionTime,
    fieldDropOff,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Get the fields with highest abandonment rates
 * Useful for identifying problem fields
 */
export function getProblematicFields(
  dropOffAnalytics: FormDropOffAnalytics,
  threshold: number = 10  // Default 10% abandonment rate threshold
): Array<{
  fieldPath: string;
  abandonmentRate: number;
  abandonmentCount: number;
}> {
  return Object.entries(dropOffAnalytics.fieldDropOff)
    .filter(([_, stats]) => stats.abandonmentRate >= threshold)
    .map(([fieldPath, stats]) => ({
      fieldPath,
      abandonmentRate: stats.abandonmentRate,
      abandonmentCount: stats.abandonmentCount,
    }))
    .sort((a, b) => b.abandonmentRate - a.abandonmentRate);
}

/**
 * Calculate funnel conversion rates between fields
 * Shows what percentage of users move from one field to the next
 */
export function calculateFieldFunnel(
  dropOffAnalytics: FormDropOffAnalytics,
  fieldOrder: string[]
): Array<{
  fieldPath: string;
  viewCount: number;
  interactionCount: number;
  completionCount: number;
  conversionRate: number;  // % who completed this field out of those who viewed it
  dropOffRate: number;     // % who abandoned at this field
}> {
  return fieldOrder.map(fieldPath => {
    const stats = dropOffAnalytics.fieldDropOff[fieldPath];
    if (!stats) {
      return {
        fieldPath,
        viewCount: 0,
        interactionCount: 0,
        completionCount: 0,
        conversionRate: 0,
        dropOffRate: 0,
      };
    }

    const conversionRate = stats.viewCount > 0
      ? (stats.completionCount / stats.viewCount) * 100
      : 0;

    return {
      fieldPath,
      viewCount: stats.viewCount,
      interactionCount: stats.interactionCount,
      completionCount: stats.completionCount,
      conversionRate,
      dropOffRate: stats.abandonmentRate,
    };
  });
}
