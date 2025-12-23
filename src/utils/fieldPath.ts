/**
 * Utility functions for generating and managing field paths
 */

/**
 * Generate a clean, human-readable field path from a label
 * Examples:
 *   "Your Name" -> "yourName"
 *   "Email Address" -> "emailAddress"
 *   "Phone Number (Optional)" -> "phoneNumberOptional"
 */
export function generateFieldPath(label: string, existingPaths: string[] = []): string {
  // Convert to camelCase
  let path = label
    .trim()
    .toLowerCase()
    // Remove special characters except spaces
    .replace(/[^a-z0-9\s]/g, '')
    // Split by spaces
    .split(/\s+/)
    // Filter empty strings
    .filter(Boolean)
    // Convert to camelCase
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');

  // If empty, use a default
  if (!path) {
    path = 'question';
  }

  // Ensure uniqueness by adding a number suffix if needed
  let finalPath = path;
  let counter = 1;
  while (existingPaths.includes(finalPath)) {
    finalPath = `${path}${counter}`;
    counter++;
  }

  return finalPath;
}

/**
 * Generate a default question label based on the question type
 */
export function getDefaultLabel(typeId: string): string {
  const labelMap: Record<string, string> = {
    'short-text': 'Short Answer',
    'long-text': 'Long Answer',
    'number': 'Number',
    'email': 'Email Address',
    'phone': 'Phone Number',
    'url': 'Website URL',
    'date': 'Date',
    'time': 'Time',
    'dropdown': 'Select Option',
    'multiple-choice': 'Choose One',
    'checkboxes': 'Select All That Apply',
    'yes-no': 'Yes or No',
    'rating': 'Rating',
    'scale': 'Scale Rating',
    'tags': 'Tags',
    'file': 'File Upload',
    'image': 'Image Upload',
    'signature': 'Signature',
    'location': 'Location',
    'color': 'Color',
    'repeater': 'Items',
    'section': 'Section Title',
  };

  return labelMap[typeId] || 'Question';
}
