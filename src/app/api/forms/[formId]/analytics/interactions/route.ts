import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, ensureSessionId } from '@/lib/session';
import { promises as fs } from 'fs';
import path from 'path';
import { FieldInteractionEvent } from '@/types/form';

export const dynamic = 'force-dynamic';

const DATA_DIR = process.env.DATA_DIR || './.data';
const INTERACTIONS_FILE = 'field-interactions.json';

interface StoredInteraction {
  formId: string;
  sessionId: string;
  submissionId?: string;
  fieldInteractions: Record<string, {
    firstViewedAt?: number;
    firstFocusAt?: number;
    lastBlurAt?: number;
    totalFocusTime?: number;
    changeCount?: number;
    completed?: boolean;
  }>;
  completed: boolean;
  recordedAt: string;
}

/**
 * Ensure data directory exists
 */
async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory exists
  }
}

/**
 * Get all interactions
 */
async function getInteractions(): Promise<StoredInteraction[]> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, INTERACTIONS_FILE);

  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Save all interactions
 */
async function saveInteractions(interactions: StoredInteraction[]): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, INTERACTIONS_FILE);
  await fs.writeFile(filePath, JSON.stringify(interactions, null, 2));
}

/**
 * POST - Record field interactions (on submit or abandon)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const body = await request.json();

    const session = await getIronSession(await cookies(), sessionOptions);
    const sessionId = ensureSessionId(session);
    await session.save();

    // Validate required fields
    if (!body.fieldInteractions || typeof body.fieldInteractions !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Field interactions data is required' },
        { status: 400 }
      );
    }

    const interaction: StoredInteraction = {
      formId,
      sessionId,
      submissionId: body.submissionId,
      fieldInteractions: body.fieldInteractions,
      completed: body.completed ?? false,
      recordedAt: new Date().toISOString(),
    };

    // Save interaction
    const interactions = await getInteractions();
    interactions.push(interaction);

    // Keep only last 10000 interactions to prevent file bloat
    if (interactions.length > 10000) {
      interactions.splice(0, interactions.length - 10000);
    }

    await saveInteractions(interactions);

    return NextResponse.json({
      success: true,
      recorded: true,
    });
  } catch (error: any) {
    console.error('Error recording interactions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record interactions' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get interaction analytics for a form
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const session = await getIronSession(await cookies(), sessionOptions);
    ensureSessionId(session);

    // Get all interactions for this form
    const allInteractions = await getInteractions();
    const formInteractions = allInteractions.filter(i => i.formId === formId);

    // Calculate aggregate stats
    const totalSessions = formInteractions.length;
    const completedSessions = formInteractions.filter(i => i.completed).length;
    const abandonedSessions = totalSessions - completedSessions;

    // Aggregate field-level stats
    const fieldStats: Record<string, {
      viewCount: number;
      interactionCount: number;
      completionCount: number;
      totalFocusTime: number;
      focusTimeCount: number;
      abandonmentCount: number;
    }> = {};

    formInteractions.forEach(session => {
      Object.entries(session.fieldInteractions).forEach(([fieldPath, interaction]) => {
        if (!fieldStats[fieldPath]) {
          fieldStats[fieldPath] = {
            viewCount: 0,
            interactionCount: 0,
            completionCount: 0,
            totalFocusTime: 0,
            focusTimeCount: 0,
            abandonmentCount: 0,
          };
        }

        if (interaction.firstViewedAt) {
          fieldStats[fieldPath].viewCount++;
        }

        if (interaction.firstFocusAt) {
          fieldStats[fieldPath].interactionCount++;
        }

        if (interaction.completed) {
          fieldStats[fieldPath].completionCount++;
        }

        if (interaction.totalFocusTime) {
          fieldStats[fieldPath].totalFocusTime += interaction.totalFocusTime;
          fieldStats[fieldPath].focusTimeCount++;
        }
      });

      // Find last field interacted with for abandoned sessions
      if (!session.completed) {
        let lastField: string | null = null;
        let lastTime = 0;

        Object.entries(session.fieldInteractions).forEach(([fieldPath, interaction]) => {
          const time = interaction.lastBlurAt || interaction.firstFocusAt || 0;
          if (time > lastTime) {
            lastTime = time;
            lastField = fieldPath;
          }
        });

        if (lastField && fieldStats[lastField]) {
          fieldStats[lastField].abandonmentCount++;
        }
      }
    });

    // Calculate rates and averages
    const fieldDropOff: Record<string, {
      viewCount: number;
      interactionCount: number;
      completionCount: number;
      abandonmentCount: number;
      abandonmentRate: number;
      averageTimeSpent: number;
    }> = {};

    Object.entries(fieldStats).forEach(([fieldPath, stats]) => {
      const abandonmentRate = totalSessions > 0
        ? (stats.abandonmentCount / totalSessions) * 100
        : 0;

      const averageTimeSpent = stats.focusTimeCount > 0
        ? (stats.totalFocusTime / stats.focusTimeCount) / 1000
        : 0;

      fieldDropOff[fieldPath] = {
        viewCount: stats.viewCount,
        interactionCount: stats.interactionCount,
        completionCount: stats.completionCount,
        abandonmentCount: stats.abandonmentCount,
        abandonmentRate,
        averageTimeSpent,
      };
    });

    return NextResponse.json({
      success: true,
      analytics: {
        formId,
        totalSessions,
        completedSessions,
        abandonedSessions,
        fieldDropOff,
        calculatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error getting interaction analytics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get analytics' },
      { status: 500 }
    );
  }
}
