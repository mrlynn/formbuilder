'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePipeline } from '@/contexts/PipelineContext';
import { Document } from 'mongodb';

export function useFieldSuggestions() {
  const { connectionString, databaseName, collection, sampleDocs } = usePipeline();
  const [fieldNames, setFieldNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Extract field names from sample documents
  useEffect(() => {
    if (sampleDocs.length > 0) {
      const fields = new Set<string>();
      sampleDocs.forEach((doc) => {
        extractFields(doc, fields, '');
      });
      setFieldNames(Array.from(fields).sort());
    } else if (connectionString && databaseName && collection) {
      // Fetch sample documents to get field names
      fetchFieldNames();
    } else {
      setFieldNames([]);
    }
  }, [connectionString, databaseName, collection, sampleDocs]);

  const extractFields = (obj: any, fields: Set<string>, prefix: string) => {
    if (obj === null || obj === undefined) return;
    
    if (Array.isArray(obj)) {
      // For arrays, check first element if it's an object
      if (obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null) {
        extractFields(obj[0], fields, prefix ? `${prefix}[]` : '');
      }
    } else if (typeof obj === 'object') {
      Object.keys(obj).forEach((key) => {
        const fullPath = prefix ? `${prefix}.${key}` : key;
        fields.add(fullPath);
        
        // Recursively extract nested fields (limit depth to avoid too many suggestions)
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          const depth = fullPath.split('.').length;
          if (depth < 3) { // Limit to 3 levels deep
            extractFields(obj[key], fields, fullPath);
          }
        } else if (Array.isArray(obj[key]) && obj[key].length > 0 && typeof obj[key][0] === 'object') {
          const depth = fullPath.split('.').length;
          if (depth < 3) {
            extractFields(obj[key][0], fields, `${fullPath}[]`);
          }
        }
      });
    }
  };

  const fetchFieldNames = async () => {
    if (!connectionString || !databaseName || !collection) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/mongodb/sample-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionString,
          databaseName,
          collection,
          limit: 10 // Just need a few to infer schema
        })
      });

      const data = await response.json();

      if (data.success && data.documents) {
        const fields = new Set<string>();
        data.documents.forEach((doc: Document) => {
          extractFields(doc, fields, '');
        });
        setFieldNames(Array.from(fields).sort());
      }
    } catch (error) {
      console.error('Failed to fetch field names:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestions = (input: string): string[] => {
    if (!input || input.trim() === '') {
      return fieldNames.slice(0, 20); // Top 20 fields
    }

    const lowerInput = input.toLowerCase();
    const exactMatches: string[] = [];
    const startsWith: string[] = [];
    const contains: string[] = [];

    fieldNames.forEach((field) => {
      const lowerField = field.toLowerCase();
      if (lowerField === lowerInput) {
        exactMatches.push(field);
      } else if (lowerField.startsWith(lowerInput)) {
        startsWith.push(field);
      } else if (lowerField.includes(lowerInput)) {
        contains.push(field);
      }
    });

    // Return in order: exact matches, starts with, contains (limit to 20)
    return [...exactMatches, ...startsWith, ...contains].slice(0, 20);
  };

  return {
    fieldNames,
    isLoading,
    getSuggestions,
    refresh: fetchFieldNames
  };
}

