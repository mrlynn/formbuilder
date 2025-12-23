/**
 * Comprehensive tests for form analytics functions
 * Tests completion rates, trends, device breakdown, and drop-off analytics
 */

import {
  calculateCompletionRate,
  calculateAverageTime,
  detectTrends,
  calculateDeviceBreakdown,
  calculateFormStats,
  calculateFormDropOffAnalytics,
  getProblematicFields,
  calculateFieldFunnel,
} from '@/lib/formAnalytics';
import { FormResponse, FieldConfig, FieldInteractionData } from '@/types/form';

// Helper to create a mock response
const createResponse = (overrides: Partial<FormResponse> = {}): FormResponse => ({
  _id: `response-${Date.now()}-${Math.random()}`,
  formId: 'test-form',
  formVersion: 1,
  data: {},
  status: 'submitted',
  submittedAt: new Date(),
  metadata: {},
  ...overrides,
});

describe('Form Analytics', () => {
  // ===========================================
  // calculateCompletionRate tests
  // ===========================================
  describe('calculateCompletionRate', () => {
    it('should return 0 for empty responses array', () => {
      expect(calculateCompletionRate([])).toBe(0);
    });

    it('should return 100 when all responses are submitted', () => {
      const responses = [
        createResponse({ status: 'submitted' }),
        createResponse({ status: 'submitted' }),
        createResponse({ status: 'submitted' }),
      ];
      expect(calculateCompletionRate(responses)).toBe(100);
    });

    it('should return 0 when no responses are submitted', () => {
      const responses = [
        createResponse({ status: 'draft' }),
        createResponse({ status: 'incomplete' }),
      ];
      expect(calculateCompletionRate(responses)).toBe(0);
    });

    it('should calculate correct percentage for mixed statuses', () => {
      const responses = [
        createResponse({ status: 'submitted' }),
        createResponse({ status: 'submitted' }),
        createResponse({ status: 'draft' }),
        createResponse({ status: 'incomplete' }),
      ];
      expect(calculateCompletionRate(responses)).toBe(50);
    });

    it('should handle single response', () => {
      expect(calculateCompletionRate([createResponse({ status: 'submitted' })])).toBe(100);
      expect(calculateCompletionRate([createResponse({ status: 'draft' })])).toBe(0);
    });
  });

  // ===========================================
  // calculateAverageTime tests
  // ===========================================
  describe('calculateAverageTime', () => {
    it('should return 0 for empty responses array', () => {
      expect(calculateAverageTime([])).toBe(0);
    });

    it('should return 0 when no responses have completion time', () => {
      const responses = [
        createResponse({ completionTime: undefined }),
        createResponse({ completionTime: undefined }),
      ];
      expect(calculateAverageTime(responses)).toBe(0);
    });

    it('should calculate average for single response', () => {
      const responses = [createResponse({ completionTime: 120 })];
      expect(calculateAverageTime(responses)).toBe(120);
    });

    it('should calculate average for multiple responses', () => {
      const responses = [
        createResponse({ completionTime: 60 }),
        createResponse({ completionTime: 120 }),
        createResponse({ completionTime: 180 }),
      ];
      expect(calculateAverageTime(responses)).toBe(120);
    });

    it('should ignore responses without completion time', () => {
      const responses = [
        createResponse({ completionTime: 100 }),
        createResponse({ completionTime: undefined }),
        createResponse({ completionTime: 200 }),
      ];
      expect(calculateAverageTime(responses)).toBe(150);
    });

    it('should handle null completion times', () => {
      const responses = [
        createResponse({ completionTime: 100 }),
        createResponse({ completionTime: null as any }),
      ];
      expect(calculateAverageTime(responses)).toBe(100);
    });
  });

  // ===========================================
  // detectTrends tests
  // ===========================================
  describe('detectTrends', () => {
    it('should return empty array for empty responses', () => {
      expect(detectTrends([])).toEqual([]);
    });

    it('should group responses by date', () => {
      const responses = [
        createResponse({ submittedAt: new Date('2024-01-15T10:00:00Z') }),
        createResponse({ submittedAt: new Date('2024-01-15T14:00:00Z') }),
        createResponse({ submittedAt: new Date('2024-01-16T10:00:00Z') }),
      ];

      const trends = detectTrends(responses);

      expect(trends).toHaveLength(2);
      expect(trends[0]).toEqual({ date: '2024-01-15', count: 2 });
      expect(trends[1]).toEqual({ date: '2024-01-16', count: 1 });
    });

    it('should sort results by date ascending', () => {
      const responses = [
        createResponse({ submittedAt: new Date('2024-01-20') }),
        createResponse({ submittedAt: new Date('2024-01-10') }),
        createResponse({ submittedAt: new Date('2024-01-15') }),
      ];

      const trends = detectTrends(responses);

      expect(trends.map(t => t.date)).toEqual(['2024-01-10', '2024-01-15', '2024-01-20']);
    });

    it('should filter by time range when provided', () => {
      const responses = [
        createResponse({ submittedAt: new Date('2024-01-10') }),
        createResponse({ submittedAt: new Date('2024-01-15') }),
        createResponse({ submittedAt: new Date('2024-01-20') }),
        createResponse({ submittedAt: new Date('2024-01-25') }),
      ];

      const timeRange = {
        start: new Date('2024-01-12'),
        end: new Date('2024-01-22'),
      };

      const trends = detectTrends(responses, timeRange);

      expect(trends).toHaveLength(2);
      expect(trends.map(t => t.date)).toEqual(['2024-01-15', '2024-01-20']);
    });
  });

  // ===========================================
  // calculateDeviceBreakdown tests
  // ===========================================
  describe('calculateDeviceBreakdown', () => {
    it('should return all zeros for empty responses', () => {
      const breakdown = calculateDeviceBreakdown([]);
      expect(breakdown).toEqual({
        mobile: 0,
        desktop: 0,
        tablet: 0,
        unknown: 0,
      });
    });

    it('should count devices correctly', () => {
      const responses = [
        createResponse({ metadata: { deviceType: 'mobile' } }),
        createResponse({ metadata: { deviceType: 'mobile' } }),
        createResponse({ metadata: { deviceType: 'desktop' } }),
        createResponse({ metadata: { deviceType: 'tablet' } }),
      ];

      const breakdown = calculateDeviceBreakdown(responses);

      expect(breakdown.mobile).toBe(2);
      expect(breakdown.desktop).toBe(1);
      expect(breakdown.tablet).toBe(1);
    });

    it('should count missing device type as unknown', () => {
      const responses = [
        createResponse({ metadata: {} }),
        createResponse({ metadata: { deviceType: undefined } }),
      ];

      const breakdown = calculateDeviceBreakdown(responses);

      expect(breakdown.unknown).toBe(2);
    });
  });

  // ===========================================
  // calculateFormStats tests
  // ===========================================
  describe('calculateFormStats', () => {
    it('should calculate all stats correctly', () => {
      const responses = [
        createResponse({
          status: 'submitted',
          completionTime: 60,
          submittedAt: new Date('2024-01-15'),
          metadata: { deviceType: 'mobile' },
        }),
        createResponse({
          status: 'submitted',
          completionTime: 120,
          submittedAt: new Date('2024-01-15'),
          metadata: { deviceType: 'desktop' },
        }),
        createResponse({
          status: 'draft',
          submittedAt: new Date('2024-01-16'),
          metadata: { deviceType: 'mobile' },
        }),
      ];

      const stats = calculateFormStats('test-form', responses);

      expect(stats.totalResponses).toBe(3);
      expect(stats.completionRate).toBeCloseTo(66.67, 1);
      expect(stats.averageCompletionTime).toBe(90);
      expect(stats.responseTrend).toHaveLength(2);
      expect(stats.deviceBreakdown.mobile).toBe(2);
      expect(stats.deviceBreakdown.desktop).toBe(1);
    });

    it('should handle empty responses', () => {
      const stats = calculateFormStats('test-form', []);

      expect(stats.totalResponses).toBe(0);
      expect(stats.completionRate).toBe(0);
      expect(stats.averageCompletionTime).toBe(0);
      expect(stats.responseTrend).toEqual([]);
    });
  });

  // ===========================================
  // Drop-off Analytics tests
  // ===========================================
  describe('calculateFormDropOffAnalytics', () => {
    const fieldConfigs: FieldConfig[] = [
      { path: 'name', label: 'Name', type: 'string', included: true, required: true },
      { path: 'email', label: 'Email', type: 'string', included: true, required: true },
      { path: 'phone', label: 'Phone', type: 'string', included: true, required: false },
    ];

    it('should calculate drop-off for empty submissions', () => {
      const analytics = calculateFormDropOffAnalytics('test-form', fieldConfigs, []);

      expect(analytics.totalSessions).toBe(0);
      expect(analytics.completedSessions).toBe(0);
      expect(analytics.abandonedSessions).toBe(0);
      expect(Object.keys(analytics.fieldDropOff)).toHaveLength(3);
    });

    it('should track completed sessions', () => {
      const submissions = [
        {
          sessionId: 'session-1',
          status: 'submitted' as const,
          fieldInteractions: {
            name: { firstViewedAt: 1000, firstFocusAt: 1100, completed: true },
            email: { firstViewedAt: 2000, firstFocusAt: 2100, completed: true },
            phone: { firstViewedAt: 3000, firstFocusAt: 3100, completed: true },
          },
        },
        {
          sessionId: 'session-2',
          status: 'submitted' as const,
          fieldInteractions: {
            name: { firstViewedAt: 1000, firstFocusAt: 1100, completed: true },
            email: { firstViewedAt: 2000, firstFocusAt: 2100, completed: true },
            phone: { firstViewedAt: 3000, completed: false },
          },
        },
      ];

      const analytics = calculateFormDropOffAnalytics('test-form', fieldConfigs, submissions);

      expect(analytics.totalSessions).toBe(2);
      expect(analytics.completedSessions).toBe(2);
      expect(analytics.abandonedSessions).toBe(0);
    });

    it('should track abandoned sessions', () => {
      const submissions = [
        {
          sessionId: 'session-1',
          status: 'submitted' as const,
          fieldInteractions: {
            name: { firstViewedAt: 1000, firstFocusAt: 1100, lastBlurAt: 1200, completed: true },
            email: { firstViewedAt: 2000, firstFocusAt: 2100, completed: true },
          },
        },
        {
          sessionId: 'session-2',
          status: 'incomplete' as const,
          fieldInteractions: {
            name: { firstViewedAt: 1000, firstFocusAt: 1100, lastBlurAt: 1500, completed: true },
            email: { firstViewedAt: 2000, firstFocusAt: 2100, lastBlurAt: 2500, completed: false },
          },
        },
      ];

      const analytics = calculateFormDropOffAnalytics('test-form', fieldConfigs, submissions);

      expect(analytics.totalSessions).toBe(2);
      expect(analytics.completedSessions).toBe(1);
      expect(analytics.abandonedSessions).toBe(1);

      // Email should have 1 abandonment (session-2 abandoned at email)
      expect(analytics.fieldDropOff.email.abandonmentCount).toBe(1);
    });

    it('should calculate view and interaction counts', () => {
      const submissions = [
        {
          sessionId: 'session-1',
          status: 'submitted' as const,
          fieldInteractions: {
            name: { firstViewedAt: 1000, firstFocusAt: 1100, completed: true },
            email: { firstViewedAt: 2000, firstFocusAt: 2100, completed: true },
          },
        },
        {
          sessionId: 'session-2',
          status: 'incomplete' as const,
          fieldInteractions: {
            name: { firstViewedAt: 1000, firstFocusAt: 1100, completed: true },
            email: { firstViewedAt: 2000 }, // Viewed but not interacted
          },
        },
      ];

      const analytics = calculateFormDropOffAnalytics('test-form', fieldConfigs, submissions);

      expect(analytics.fieldDropOff.name.viewCount).toBe(2);
      expect(analytics.fieldDropOff.name.interactionCount).toBe(2);
      expect(analytics.fieldDropOff.email.viewCount).toBe(2);
      expect(analytics.fieldDropOff.email.interactionCount).toBe(1);
    });

    it('should calculate average time spent on fields', () => {
      const submissions = [
        {
          sessionId: 'session-1',
          status: 'submitted' as const,
          fieldInteractions: {
            name: { firstViewedAt: 1000, totalFocusTime: 5000, completed: true }, // 5 seconds
            email: { firstViewedAt: 2000, totalFocusTime: 10000, completed: true }, // 10 seconds
          },
        },
        {
          sessionId: 'session-2',
          status: 'submitted' as const,
          fieldInteractions: {
            name: { firstViewedAt: 1000, totalFocusTime: 3000, completed: true }, // 3 seconds
            email: { firstViewedAt: 2000, totalFocusTime: 6000, completed: true }, // 6 seconds
          },
        },
      ];

      const analytics = calculateFormDropOffAnalytics('test-form', fieldConfigs, submissions);

      expect(analytics.fieldDropOff.name.averageTimeSpent).toBe(4); // (5+3)/2 = 4 seconds
      expect(analytics.fieldDropOff.email.averageTimeSpent).toBe(8); // (10+6)/2 = 8 seconds
    });

    it('should skip submissions without field interactions', () => {
      const submissions = [
        {
          sessionId: 'session-1',
          status: 'submitted' as const,
          fieldInteractions: {
            name: { completed: true },
          },
        },
        {
          sessionId: 'session-2',
          status: 'submitted' as const,
          fieldInteractions: undefined,
        },
        {
          sessionId: 'session-3',
          status: 'submitted' as const,
          fieldInteractions: {},
        },
      ];

      const analytics = calculateFormDropOffAnalytics('test-form', fieldConfigs, submissions);

      expect(analytics.totalSessions).toBe(1);
    });
  });

  // ===========================================
  // getProblematicFields tests
  // ===========================================
  describe('getProblematicFields', () => {
    it('should return empty array when no fields exceed threshold', () => {
      const dropOffAnalytics = {
        formId: 'test-form',
        totalSessions: 100,
        completedSessions: 95,
        abandonedSessions: 5,
        averageCompletionTime: 120,
        fieldDropOff: {
          name: { viewCount: 100, interactionCount: 100, completionCount: 100, abandonmentCount: 1, abandonmentRate: 1, averageTimeSpent: 5 },
          email: { viewCount: 100, interactionCount: 99, completionCount: 99, abandonmentCount: 2, abandonmentRate: 2, averageTimeSpent: 8 },
        },
        calculatedAt: new Date().toISOString(),
      };

      const problematic = getProblematicFields(dropOffAnalytics, 10);

      expect(problematic).toEqual([]);
    });

    it('should return fields exceeding threshold sorted by rate', () => {
      const dropOffAnalytics = {
        formId: 'test-form',
        totalSessions: 100,
        completedSessions: 70,
        abandonedSessions: 30,
        averageCompletionTime: 120,
        fieldDropOff: {
          name: { viewCount: 100, interactionCount: 100, completionCount: 95, abandonmentCount: 5, abandonmentRate: 5, averageTimeSpent: 5 },
          email: { viewCount: 95, interactionCount: 90, completionCount: 80, abandonmentCount: 15, abandonmentRate: 15, averageTimeSpent: 8 },
          phone: { viewCount: 80, interactionCount: 70, completionCount: 70, abandonmentCount: 10, abandonmentRate: 12.5, averageTimeSpent: 3 },
        },
        calculatedAt: new Date().toISOString(),
      };

      const problematic = getProblematicFields(dropOffAnalytics, 10);

      expect(problematic).toHaveLength(2);
      expect(problematic[0].fieldPath).toBe('email');
      expect(problematic[0].abandonmentRate).toBe(15);
      expect(problematic[1].fieldPath).toBe('phone');
    });

    it('should use default threshold of 10%', () => {
      const dropOffAnalytics = {
        formId: 'test-form',
        totalSessions: 100,
        completedSessions: 85,
        abandonedSessions: 15,
        averageCompletionTime: 120,
        fieldDropOff: {
          name: { viewCount: 100, interactionCount: 100, completionCount: 95, abandonmentCount: 5, abandonmentRate: 5, averageTimeSpent: 5 },
          email: { viewCount: 95, interactionCount: 90, completionCount: 85, abandonmentCount: 10, abandonmentRate: 10, averageTimeSpent: 8 },
        },
        calculatedAt: new Date().toISOString(),
      };

      const problematic = getProblematicFields(dropOffAnalytics);

      expect(problematic).toHaveLength(1);
      expect(problematic[0].fieldPath).toBe('email');
    });
  });

  // ===========================================
  // calculateFieldFunnel tests
  // ===========================================
  describe('calculateFieldFunnel', () => {
    it('should calculate funnel for ordered fields', () => {
      const dropOffAnalytics = {
        formId: 'test-form',
        totalSessions: 100,
        completedSessions: 80,
        abandonedSessions: 20,
        averageCompletionTime: 120,
        fieldDropOff: {
          name: { viewCount: 100, interactionCount: 98, completionCount: 95, abandonmentCount: 5, abandonmentRate: 5, averageTimeSpent: 5 },
          email: { viewCount: 95, interactionCount: 90, completionCount: 85, abandonmentCount: 10, abandonmentRate: 10, averageTimeSpent: 8 },
          phone: { viewCount: 85, interactionCount: 80, completionCount: 80, abandonmentCount: 5, abandonmentRate: 5.9, averageTimeSpent: 3 },
        },
        calculatedAt: new Date().toISOString(),
      };

      const funnel = calculateFieldFunnel(dropOffAnalytics, ['name', 'email', 'phone']);

      expect(funnel).toHaveLength(3);

      // Name field
      expect(funnel[0].fieldPath).toBe('name');
      expect(funnel[0].viewCount).toBe(100);
      expect(funnel[0].conversionRate).toBe(95); // 95/100 * 100
      expect(funnel[0].dropOffRate).toBe(5);

      // Email field
      expect(funnel[1].fieldPath).toBe('email');
      expect(funnel[1].viewCount).toBe(95);
      expect(funnel[1].conversionRate).toBeCloseTo(89.47, 1); // 85/95 * 100

      // Phone field
      expect(funnel[2].fieldPath).toBe('phone');
    });

    it('should handle missing field stats gracefully', () => {
      const dropOffAnalytics = {
        formId: 'test-form',
        totalSessions: 100,
        completedSessions: 80,
        abandonedSessions: 20,
        averageCompletionTime: 120,
        fieldDropOff: {
          name: { viewCount: 100, interactionCount: 98, completionCount: 95, abandonmentCount: 5, abandonmentRate: 5, averageTimeSpent: 5 },
        },
        calculatedAt: new Date().toISOString(),
      };

      const funnel = calculateFieldFunnel(dropOffAnalytics, ['name', 'email', 'phone']);

      expect(funnel).toHaveLength(3);
      expect(funnel[1].viewCount).toBe(0);
      expect(funnel[1].conversionRate).toBe(0);
    });

    it('should handle zero view count without division errors', () => {
      const dropOffAnalytics = {
        formId: 'test-form',
        totalSessions: 0,
        completedSessions: 0,
        abandonedSessions: 0,
        averageCompletionTime: 0,
        fieldDropOff: {
          name: { viewCount: 0, interactionCount: 0, completionCount: 0, abandonmentCount: 0, abandonmentRate: 0, averageTimeSpent: 0 },
        },
        calculatedAt: new Date().toISOString(),
      };

      const funnel = calculateFieldFunnel(dropOffAnalytics, ['name']);

      expect(funnel[0].conversionRate).toBe(0);
      expect(funnel[0].dropOffRate).toBe(0);
    });
  });
});
