import { StageDefinition } from '@/types/pipeline';

export const stageDefinitions: StageDefinition[] = [
  {
    type: '$match',
    name: 'Match',
    icon: 'FilterList',
    color: '#2196F3', // Blue
    category: 'filter',
    description: 'Filter documents that match specified conditions',
    defaultConfig: {}
  },
  {
    type: '$group',
    name: 'Group',
    icon: 'GroupWork',
    color: '#9C27B0', // Purple
    category: 'transform',
    description: 'Group documents by specified expression and apply accumulators',
    defaultConfig: { _id: null }
  },
  {
    type: '$project',
    name: 'Project',
    icon: 'ViewColumn',
    color: '#4CAF50', // Green
    category: 'shape',
    description: 'Reshape documents by including, excluding, or adding fields',
    defaultConfig: { _id: 1 }
  },
  {
    type: '$sort',
    name: 'Sort',
    icon: 'Sort',
    color: '#FF9800', // Orange
    category: 'shape',
    description: 'Sort documents by specified field(s)',
    defaultConfig: {}
  },
  {
    type: '$limit',
    name: 'Limit',
    icon: 'Compress',
    color: '#757575', // Gray
    category: 'shape',
    description: 'Limit the number of documents passed to the next stage',
    defaultConfig: { limit: 10 }
  },
  {
    type: '$skip',
    name: 'Skip',
    icon: 'SkipNext',
    color: '#757575', // Gray
    category: 'shape',
    description: 'Skip a specified number of documents',
    defaultConfig: { skip: 0 }
  },
  {
    type: '$unwind',
    name: 'Unwind',
    icon: 'UnfoldMore',
    color: '#009688', // Teal
    category: 'transform',
    description: 'Deconstruct an array field to output a document for each element',
    defaultConfig: { path: '' }
  },
  {
    type: '$lookup',
    name: 'Lookup',
    icon: 'Link',
    color: '#3F51B5', // Indigo
    category: 'join',
    description: 'Perform a left outer join with another collection',
    defaultConfig: { from: '', localField: '', foreignField: '', as: 'joined' }
  },
  {
    type: '$addFields',
    name: 'Add Fields',
    icon: 'Add',
    color: '#CDDC39', // Lime
    category: 'transform',
    description: 'Add new fields or modify existing fields',
    defaultConfig: {}
  },
  {
    type: '$count',
    name: 'Count',
    icon: 'Tag',
    color: '#E91E63', // Pink
    category: 'shape',
    description: 'Return a count of documents',
    defaultConfig: { count: 'total' }
  }
];

export const getStageDefinition = (stageType: string): StageDefinition | undefined => {
  return stageDefinitions.find((def) => def.type === stageType);
};

export const getStagesByCategory = (category: StageDefinition['category']) => {
  return stageDefinitions.filter((def) => def.category === category);
};

