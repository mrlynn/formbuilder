import { TourStep } from '@/components/Help/OnboardingTour';

// Pipeline Builder tour steps
export const pipelineBuilderTourSteps: TourStep[] = [
  {
    target: 'center',
    title: 'Welcome to the Pipeline Builder!',
    content:
      'This tool helps you visually build MongoDB aggregation pipelines. Let\'s take a quick tour of the main features.',
    placement: 'center',
    disableOverlay: true,
  },
  {
    target: '[data-tour="connection-panel"]',
    title: 'Connect to MongoDB',
    content:
      'Start by connecting to your MongoDB database. Enter your connection string and select a database and collection to work with.',
    placement: 'right',
    spotlightPadding: 4,
  },
  {
    target: '[data-tour="stage-library"]',
    title: 'Stage Library',
    content:
      'Drag aggregation stages from here onto the canvas. Stages include $match for filtering, $group for aggregating, $project for reshaping documents, and more.',
    placement: 'right',
    spotlightPadding: 4,
  },
  {
    target: '[data-tour="pipeline-canvas"]',
    title: 'Pipeline Canvas',
    content:
      'This is where you build your pipeline. Drag stages here, connect them together, and arrange them in the order you want them to execute.',
    placement: 'bottom',
    spotlightPadding: 8,
  },
  {
    target: '[data-tour="config-panel"]',
    title: 'Configuration Panel',
    content:
      'Click on any stage to configure it. This panel shows options specific to each stage type, like filter conditions for $match or field selections for $project.',
    placement: 'left',
    spotlightPadding: 4,
  },
  {
    target: '[data-tour="run-pipeline"]',
    title: 'Run Your Pipeline',
    content:
      'Once your pipeline is ready, click "Run Pipeline" to execute it against your collection and see the results below.',
    placement: 'bottom',
    spotlightPadding: 4,
  },
  {
    target: '[data-tour="ai-input"]',
    title: 'AI-Powered Pipeline Generation',
    content:
      'Describe what you want to accomplish in plain English, and AI will generate a pipeline for you. Try it with queries like "find all documents where status is active".',
    placement: 'top',
    spotlightPadding: 8,
  },
  {
    target: 'center',
    title: 'You\'re All Set!',
    content:
      'Press Cmd+/ (or Ctrl+/) anytime to search help topics. Now go ahead and build your first aggregation pipeline!',
    placement: 'center',
    disableOverlay: true,
  },
];

// Form Builder tour steps
export const formBuilderTourSteps: TourStep[] = [
  {
    target: 'center',
    title: 'Welcome to the Form Builder!',
    content:
      'Create dynamic data entry forms based on your MongoDB collection schema. Let\'s walk through the key features.',
    placement: 'center',
    disableOverlay: true,
  },
  {
    target: '[data-tour="form-connection"]',
    title: 'Connect to MongoDB',
    content:
      'Connect to your database and select a collection. The Form Builder will analyze sample documents to suggest field configurations.',
    placement: 'right',
    spotlightPadding: 4,
  },
  {
    target: '[data-tour="field-list"]',
    title: 'Field Configuration',
    content:
      'Configure each field in your form. Set labels, types, validation rules, and choose which fields to include.',
    placement: 'right',
    spotlightPadding: 4,
  },
  {
    target: '[data-tour="form-preview"]',
    title: 'Form Preview',
    content:
      'See a live preview of your form as you configure it. Changes appear instantly so you can fine-tune the user experience.',
    placement: 'left',
    spotlightPadding: 8,
  },
  {
    target: '[data-tour="document-preview"]',
    title: 'Document Preview',
    content:
      'View the MongoDB document structure that will be generated from form submissions. This helps ensure your data format is correct.',
    placement: 'left',
    spotlightPadding: 4,
  },
  {
    target: '[data-tour="form-toolbar"]',
    title: 'Save and Publish',
    content:
      'Save your forms to the library, manage versions, and publish forms for end-users to submit data.',
    placement: 'bottom',
    spotlightPadding: 4,
  },
  {
    target: 'center',
    title: 'Ready to Build!',
    content:
      'Use the help buttons throughout the interface for more details. Press Cmd+/ to search all help topics anytime.',
    placement: 'center',
    disableOverlay: true,
  },
];

// Quick start tips shown in a simpler format
export const quickStartTips = {
  'pipeline-builder': [
    {
      title: 'Drag & Drop Stages',
      description: 'Drag stages from the library onto the canvas to add them to your pipeline.',
    },
    {
      title: 'Connect Stages',
      description: 'Stages automatically connect in order. Drag to rearrange them.',
    },
    {
      title: 'Configure with Clicks',
      description: 'Click any stage to open its configuration panel on the right.',
    },
    {
      title: 'Use AI Assistance',
      description: 'Describe your query in plain English to auto-generate pipelines.',
    },
  ],
  'form-builder': [
    {
      title: 'Auto-Detect Schema',
      description: 'Connect to a collection and we\'ll suggest fields based on sample documents.',
    },
    {
      title: 'Drag to Reorder',
      description: 'Drag fields to change their order in the form.',
    },
    {
      title: 'Add Logic',
      description: 'Use conditional logic to show/hide fields based on other values.',
    },
    {
      title: 'Save Versions',
      description: 'Save snapshots of your form and restore previous versions anytime.',
    },
  ],
};
