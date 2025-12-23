/**
 * Import Example Forms Script
 *
 * Imports the example form configurations into the file-based storage
 * used by the Form Builder application.
 *
 * This writes to:
 * - .data/published-forms.json (for public access at /forms/{slug})
 * - Optionally to a session file for editing in the form builder
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory (matches fileStorage.ts)
const DATA_DIR = path.join(process.cwd(), '.data');
const PUBLISHED_FORMS_FILE = path.join(DATA_DIR, 'published-forms.json');

// Ensure data directory exists
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Read published forms
function getPublishedForms(): any[] {
  ensureDataDir();
  try {
    const data = fs.readFileSync(PUBLISHED_FORMS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Write published forms
function savePublishedForms(forms: any[]): void {
  ensureDataDir();
  fs.writeFileSync(PUBLISHED_FORMS_FILE, JSON.stringify(forms, null, 2), 'utf-8');
}

// Import forms
async function importForms() {
  // Read example form files
  const exampleFormsDir = path.join(__dirname, 'example-forms');

  if (!fs.existsSync(exampleFormsDir)) {
    console.error(`❌ Example forms directory not found: ${exampleFormsDir}`);
    process.exit(1);
  }

  const formFiles = fs.readdirSync(exampleFormsDir).filter(f => f.endsWith('.json') && f !== 'README.md');

  console.log(`Found ${formFiles.length} example form(s) to import:\n`);

  const publishedForms = getPublishedForms();
  const now = new Date().toISOString();

  for (const file of formFiles) {
    const filePath = path.join(exampleFormsDir, file);
    const formData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Generate ID if not present
    const formId = formData.id || randomUUID();

    // Check if form with same slug already exists
    const existingIndex = publishedForms.findIndex((f: any) => f.slug === formData.slug);

    const form = {
      ...formData,
      id: formId,
      createdAt: existingIndex >= 0 ? publishedForms[existingIndex].createdAt : now,
      updatedAt: now,
      publishedAt: formData.isPublished ? now : undefined,
      currentVersion: formData.currentVersion || 1
    };

    if (existingIndex >= 0) {
      // Update existing form
      publishedForms[existingIndex] = form;
      console.log(`✓ Updated: ${formData.name} (slug: ${formData.slug})`);
    } else {
      // Add new form
      publishedForms.push(form);
      console.log(`✓ Created: ${formData.name} (slug: ${formData.slug})`);
    }
  }

  // Save all published forms
  savePublishedForms(publishedForms);

  console.log('\n✅ Import complete!');
  console.log(`\nPublished forms are now available at:`);
  formFiles.forEach(file => {
    const formData = JSON.parse(fs.readFileSync(path.join(exampleFormsDir, file), 'utf-8'));
    if (formData.slug && formData.isPublished) {
      console.log(`  - http://localhost:3000/forms/${formData.slug}`);
    }
  });

  console.log(`\nTo edit these forms in the Form Builder:`);
  console.log(`  1. Go to the Form Builder page`);
  console.log(`  2. Select database: form_builder_test`);
  console.log(`  3. Select collection: employees or products`);
  console.log(`  4. Build your form from the schema`);
  console.log(`\nNote: The example JSON files serve as templates/documentation.`);
  console.log(`The Form Builder creates forms dynamically from collection schemas.`);
}

// Main execution
console.log('📥 Importing example forms to published-forms.json...\n');
importForms().catch((error) => {
  console.error('Failed to import forms:', error.message);
  process.exit(1);
});
