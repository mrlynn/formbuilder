import { FieldConfig, FieldStatistics } from '@/types/form';
import { FormResponse } from '@/types/form';

/**
 * Calculate statistics for a text field
 */
export function calculateTextStats(
  fieldPath: string,
  responses: FormResponse[]
): FieldStatistics['textStats'] {
  const values = responses
    .map(r => {
      const value = getNestedValue(r.data, fieldPath);
      return typeof value === 'string' ? value : String(value || '');
    })
    .filter(v => v.length > 0);

  if (values.length === 0) {
    return {
      averageLength: 0,
      wordCount: 0,
    };
  }

  const lengths = values.map(v => v.length);
  const totalWords = values.reduce((sum, v) => {
    return sum + v.trim().split(/\s+/).filter(w => w.length > 0).length;
  }, 0);

  // Count word frequencies
  const wordCounts: Record<string, number> = {};
  values.forEach(text => {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2); // Only count words longer than 2 chars
    
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
  });

  const commonWords = Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  return {
    averageLength: lengths.reduce((a, b) => a + b, 0) / lengths.length,
    wordCount: totalWords,
    commonWords: commonWords.length > 0 ? commonWords : undefined,
  };
}

/**
 * Calculate statistics for a number field
 */
export function calculateNumberStats(
  fieldPath: string,
  responses: FormResponse[]
): FieldStatistics['numberStats'] {
  const values = responses
    .map(r => {
      const value = getNestedValue(r.data, fieldPath);
      const num = typeof value === 'number' ? value : parseFloat(String(value || 0));
      return isNaN(num) ? null : num;
    })
    .filter((v): v is number => v !== null);

  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      median: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

  // Create distribution buckets
  const bucketCount = Math.min(10, Math.ceil(Math.sqrt(values.length)));
  const range = max - min;
  const bucketSize = range / bucketCount;
  const distribution: Record<number, number> = {};

  values.forEach(value => {
    const bucket = Math.floor((value - min) / bucketSize);
    const bucketKey = Math.min(bucket, bucketCount - 1);
    distribution[bucketKey] = (distribution[bucketKey] || 0) + 1;
  });

  const distributionArray = Array.from({ length: bucketCount }, (_, i) => ({
    range: `${(min + i * bucketSize).toFixed(1)} - ${(min + (i + 1) * bucketSize).toFixed(1)}`,
    count: distribution[i] || 0,
  }));

  return {
    min,
    max,
    average,
    median,
    distribution: distributionArray.length > 0 ? distributionArray : undefined,
  };
}

/**
 * Calculate statistics for a choice/select field
 */
export function calculateChoiceStats(
  fieldPath: string,
  responses: FormResponse[]
): FieldStatistics['choiceStats'] {
  const values = responses
    .map(r => {
      const value = getNestedValue(r.data, fieldPath);
      return value !== null && value !== undefined ? String(value) : null;
    })
    .filter((v): v is string => v !== null);

  if (values.length === 0) {
    return {
      options: [],
    };
  }

  const counts: Record<string, number> = {};
  values.forEach(value => {
    counts[value] = (counts[value] || 0) + 1;
  });

  const total = values.length;
  const options = Object.entries(counts)
    .map(([value, count]) => ({
      value,
      count,
      percentage: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    options: options.length > 0 ? options : undefined,
  };
}

/**
 * Calculate statistics for a date field
 */
export function calculateDateStats(
  fieldPath: string,
  responses: FormResponse[]
): FieldStatistics['dateStats'] {
  const dates = responses
    .map(r => {
      const value = getNestedValue(r.data, fieldPath);
      if (!value) return null;
      const date = value instanceof Date ? value : new Date(value);
      return isNaN(date.getTime()) ? null : date;
    })
    .filter((d): d is Date => d !== null);

  if (dates.length === 0) {
    return {
      earliest: new Date(),
      latest: new Date(),
    };
  }

  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const earliest = sorted[0];
  const latest = sorted[sorted.length - 1];

  // Count dates by day
  const dateCounts: Record<string, number> = {};
  dates.forEach(date => {
    const key = date.toISOString().split('T')[0];
    dateCounts[key] = (dateCounts[key] || 0) + 1;
  });

  const mostCommon = Object.entries(dateCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([date, count]) => ({ date, count }));

  return {
    earliest,
    latest,
    mostCommon: mostCommon.length > 0 ? mostCommon : undefined,
  };
}

/**
 * Calculate statistics for a boolean field
 */
export function calculateBooleanStats(
  fieldPath: string,
  responses: FormResponse[]
): FieldStatistics['booleanStats'] {
  const values = responses
    .map(r => {
      const value = getNestedValue(r.data, fieldPath);
      return value === true || value === 'true' || value === 1;
    });

  const trueCount = values.filter(v => v === true).length;
  const falseCount = values.length - trueCount;
  const total = values.length;

  return {
    trueCount,
    falseCount,
    truePercentage: total > 0 ? (trueCount / total) * 100 : 0,
    falsePercentage: total > 0 ? (falseCount / total) * 100 : 0,
  };
}

/**
 * Calculate field-level statistics
 */
export function calculateFieldStats(
  fieldConfig: FieldConfig,
  responses: FormResponse[]
): FieldStatistics {
  const fieldPath = fieldConfig.path;
  const fieldType = fieldConfig.type;
  const totalResponses = responses.length;
  
  // Count how many responses have this field filled
  const filledCount = responses.filter(r => {
    const value = getNestedValue(r.data, fieldPath);
    return value !== null && value !== undefined && value !== '';
  }).length;

  const completionRate = totalResponses > 0
    ? (filledCount / totalResponses) * 100
    : 0;

  const stats: FieldStatistics = {
    fieldPath,
    fieldType,
    totalResponses,
    completionRate,
  };

  // Add type-specific stats
  switch (fieldType) {
    case 'string':
    case 'email':
    case 'url':
      stats.textStats = calculateTextStats(fieldPath, responses);
      break;
    case 'number':
      stats.numberStats = calculateNumberStats(fieldPath, responses);
      break;
    case 'boolean':
      stats.booleanStats = calculateBooleanStats(fieldPath, responses);
      break;
    case 'date':
      stats.dateStats = calculateDateStats(fieldPath, responses);
      break;
    default:
      // For select/choice fields, try to detect if it's a choice
      const sampleValue = responses.find(r => {
        const v = getNestedValue(r.data, fieldPath);
        return v !== null && v !== undefined;
      });
      if (sampleValue) {
        stats.choiceStats = calculateChoiceStats(fieldPath, responses);
      }
  }

  return stats;
}

/**
 * Helper to get nested value from object
 */
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  return value;
}

