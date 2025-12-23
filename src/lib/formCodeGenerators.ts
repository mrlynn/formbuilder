import { FormConfiguration, FieldConfig, ConditionalLogic, FieldCondition, ConditionOperator } from '@/types/form';

// Helper to generate conditional logic evaluation code
function generateConditionalLogicHelper(isTS: boolean): string {
  const typeAnnotation = isTS ? ': any' : '';
  const boolType = isTS ? ': boolean' : '';

  return `
  const getNestedValue = (obj${typeAnnotation}, path: string)${typeAnnotation} => {
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return undefined;
      }
    }
    return value;
  };

  const evaluateCondition = (
    field: string,
    operator: string,
    compareValue${typeAnnotation},
    formData${typeAnnotation}
  )${boolType} => {
    const fieldValue = getNestedValue(formData, field);

    switch (operator) {
      case 'equals': return fieldValue === compareValue;
      case 'notEquals': return fieldValue !== compareValue;
      case 'contains':
        if (typeof fieldValue === 'string') return fieldValue.toLowerCase().includes(String(compareValue).toLowerCase());
        if (Array.isArray(fieldValue)) return fieldValue.includes(compareValue);
        return false;
      case 'notContains':
        if (typeof fieldValue === 'string') return !fieldValue.toLowerCase().includes(String(compareValue).toLowerCase());
        if (Array.isArray(fieldValue)) return !fieldValue.includes(compareValue);
        return true;
      case 'greaterThan': return typeof fieldValue === 'number' && fieldValue > Number(compareValue);
      case 'lessThan': return typeof fieldValue === 'number' && fieldValue < Number(compareValue);
      case 'isEmpty': return fieldValue === undefined || fieldValue === null || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0);
      case 'isNotEmpty': return !(fieldValue === undefined || fieldValue === null || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0));
      case 'isTrue': return fieldValue === true;
      case 'isFalse': return fieldValue === false;
      default: return true;
    }
  };
`;
}

// Helper to generate visibility check for a field
function generateFieldVisibilityCheck(field: FieldConfig): string | null {
  if (!field.conditionalLogic || field.conditionalLogic.conditions.length === 0) {
    return null;
  }

  const { action, logicType, conditions } = field.conditionalLogic;

  const conditionChecks = conditions.map((c: FieldCondition) =>
    `evaluateCondition('${c.field}', '${c.operator}', ${JSON.stringify(c.value)}, formData)`
  );

  const combinedCheck = logicType === 'all'
    ? conditionChecks.join(' && ')
    : conditionChecks.join(' || ');

  // If action is 'show', show when conditions are met; if 'hide', show when NOT met
  return action === 'show' ? combinedCheck : `!(${combinedCheck})`;
}

// Check if any field has conditional logic
function hasAnyConditionalLogic(fields: FieldConfig[]): boolean {
  return fields.some(f => f.conditionalLogic && f.conditionalLogic.conditions.length > 0);
}

export interface CodeGenerationOptions {
  framework?:
    | 'react'
    | 'vue'
    | 'angular'
    | 'html'
    | 'react-hook-form'
    | 'nextjs'
    | 'svelte'
    | 'solidjs'
    | 'remix'
    | 'python-flask'
    | 'python-fastapi'
    | 'python-django'
    | 'node-express'
    | 'php'
    | 'ruby-rails'
    | 'go-gin'
    | 'java-spring'
    | 'zod-schema'
    | 'yup-schema'
    | 'typescript-types';
  language?: 'typescript' | 'javascript' | 'python' | 'php' | 'ruby' | 'go' | 'java';
  styling?: 'mui' | 'tailwind' | 'bootstrap' | 'none';
}

export function generateFormCode(
  config: FormConfiguration,
  options: CodeGenerationOptions = {}
): string {
  const {
    framework = 'react',
    language = 'typescript',
    styling = 'mui'
  } = options;

  switch (framework) {
    // Frontend Frameworks
    case 'react':
      return generateReactForm(config, language, styling);
    case 'vue':
      return generateVueForm(config, language, styling);
    case 'angular':
      return generateAngularForm(config, language, styling);
    case 'html':
      return generateHTMLForm(config, styling);
    case 'react-hook-form':
      return generateReactHookForm(config, language, styling);
    case 'nextjs':
      return generateNextJSForm(config, language, styling);
    case 'svelte':
      return generateSvelteForm(config, language, styling);
    case 'solidjs':
      return generateSolidJSForm(config, language, styling);
    case 'remix':
      return generateRemixForm(config, language, styling);
    
    // Backend Frameworks
    case 'python-flask':
      return generatePythonFlaskForm(config);
    case 'python-fastapi':
      return generatePythonFastAPIForm(config);
    case 'python-django':
      return generatePythonDjangoForm(config);
    case 'node-express':
      return generateNodeExpressForm(config, language);
    case 'php':
      return generatePHPForm(config);
    case 'ruby-rails':
      return generateRubyRailsForm(config);
    case 'go-gin':
      return generateGoGinForm(config);
    case 'java-spring':
      return generateJavaSpringForm(config);

    // Schema/Types Generation
    case 'zod-schema':
      return generateZodSchema(config);
    case 'yup-schema':
      return generateYupSchema(config);
    case 'typescript-types':
      return generateTypeScriptTypes(config);

    default:
      return generateReactForm(config, language, styling);
  }
}

function generateReactForm(
  config: FormConfiguration,
  lang: 'typescript' | 'javascript' | 'python' | 'php' | 'ruby' | 'go' | 'java',
  styling: string
): string {
  const isTS = lang === 'typescript';
  const includedFields = config.fieldConfigs.filter((f) => f.included);
  const needsConditionalLogic = hasAnyConditionalLogic(includedFields);

  // Generate fields with conditional wrappers
  const fields = includedFields.map((field) => {
    const fieldJsx = generateReactField(field, styling);
    const visibilityCheck = generateFieldVisibilityCheck(field);

    if (visibilityCheck) {
      return `{(${visibilityCheck}) && (\n  ${fieldJsx}\n)}`;
    }
    return fieldJsx;
  }).join('\n\n');

  const imports = styling === 'mui'
    ? `import { Box, TextField, Button, Switch, FormControlLabel } from '@mui/material';`
    : '';

  const conditionalHelpers = needsConditionalLogic ? generateConditionalLogicHelper(isTS) : '';

  return `${imports}
import { useState } from 'react';
${isTS ? `import { FormData } from './types';` : ''}

export function ${config.name.replace(/\s+/g, '')}Form() {
  const [formData, setFormData] = useState${isTS ? '<FormData>' : ''}({
${includedFields.map(f => `    ${f.path}: ${JSON.stringify(f.defaultValue || '')}`).join(',\n')}
  });

  const handleChange = (path: string, value${isTS ? ': any' : ''}) => {
    setFormData((prev) => {
      const newData = { ...prev };
      setNestedValue(newData, path, value);
      return newData;
    });
  };

  const setNestedValue = (obj${isTS ? ': any' : ''}, path: string, value${isTS ? ': any' : ''}) => {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((acc, key) => {
      if (!acc[key]) acc[key] = {};
      return acc[key];
    }, obj);
    target[lastKey] = value;
  };
${conditionalHelpers}
  const handleSubmit = async (e${isTS ? ': React.FormEvent' : ''}) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log('Form data:', formData);
  };

  return (
    <form onSubmit={handleSubmit}>
${fields.split('\n').map(line => '      ' + line).join('\n')}
      <Button type="submit" variant="contained" sx={{ mt: 2 }}>
        Submit
      </Button>
    </form>
  );
}
`;
}

function generateReactField(field: FieldConfig, styling: string): string {
  const fieldName = field.path.replace(/\./g, '_');
  
  switch (field.type) {
    case 'boolean':
      return styling === 'mui'
        ? `<FormControlLabel
  control={
    <Switch
      checked={formData.${fieldName} || false}
      onChange={(e) => handleChange('${field.path}', e.target.checked)}
    />
  }
  label="${field.label}"
/>`
        : `<label>
  <input
    type="checkbox"
    checked={formData.${fieldName} || false}
    onChange={(e) => handleChange('${field.path}', e.target.checked)}
  />
  ${field.label}
</label>`;

    case 'number':
      return styling === 'mui'
        ? `<TextField
  type="number"
  label="${field.label}"
  value={formData.${fieldName} || ''}
  onChange={(e) => handleChange('${field.path}', Number(e.target.value))}
  fullWidth
  required={${field.required}}
/>`
        : `<label>
  ${field.label}
  <input
    type="number"
    value={formData.${fieldName} || ''}
    onChange={(e) => handleChange('${field.path}', Number(e.target.value))}
    ${field.required ? 'required' : ''}
  />
</label>`;

    case 'date':
      return styling === 'mui'
        ? `<TextField
  type="date"
  label="${field.label}"
  value={formData.${fieldName} || ''}
  onChange={(e) => handleChange('${field.path}', e.target.value)}
  fullWidth
  required={${field.required}}
  InputLabelProps={{ shrink: true }}
/>`
        : `<label>
  ${field.label}
  <input
    type="date"
    value={formData.${fieldName} || ''}
    onChange={(e) => handleChange('${field.path}', e.target.value)}
    ${field.required ? 'required' : ''}
  />
</label>`;

    case 'email':
      return styling === 'mui'
        ? `<TextField
  type="email"
  label="${field.label}"
  placeholder="${field.placeholder || ''}"
  value={formData.${fieldName} || ''}
  onChange={(e) => handleChange('${field.path}', e.target.value)}
  fullWidth
  required={${field.required}}
/>`
        : `<label>
  ${field.label}
  <input
    type="email"
    placeholder="${field.placeholder || ''}"
    value={formData.${fieldName} || ''}
    onChange={(e) => handleChange('${field.path}', e.target.value)}
    ${field.required ? 'required' : ''}
  />
</label>`;

    default:
      return styling === 'mui'
        ? `<TextField
  label="${field.label}"
  placeholder="${field.placeholder || ''}"
  value={formData.${fieldName} || ''}
  onChange={(e) => handleChange('${field.path}', e.target.value)}
  fullWidth
  required={${field.required}}
/>`
        : `<label>
  ${field.label}
  <input
    type="text"
    placeholder="${field.placeholder || ''}"
    value={formData.${fieldName} || ''}
    onChange={(e) => handleChange('${field.path}', e.target.value)}
    ${field.required ? 'required' : ''}
  />
</label>`;
  }
}

function generateVueForm(
  config: FormConfiguration,
  lang: 'typescript' | 'javascript' | 'python' | 'php' | 'ruby' | 'go' | 'java',
  styling: string
): string {
  const isTS = lang === 'typescript';
  const includedFields = config.fieldConfigs.filter((f) => f.included);
  
  return `<template>
  <form @submit.prevent="handleSubmit">
    <!-- Form fields will be generated here -->
    <button type="submit">Submit</button>
  </form>
</template>

<script ${isTS ? 'lang="ts"' : ''}>
import { ref } from 'vue';

export default {
  name: '${config.name.replace(/\s+/g, '')}Form',
  setup() {
    const formData = ref({
${includedFields.map(f => `      ${f.path.replace(/\./g, '_')}: ${JSON.stringify(f.defaultValue || '')}`).join(',\n')}
    });

    const handleChange = (path${isTS ? ': string' : ''}, value${isTS ? ': any' : ''}) => {
      // Update formData logic
    };

    const handleSubmit = () => {
      console.log('Form data:', formData.value);
    };

    return {
      formData,
      handleChange,
      handleSubmit
    };
  }
};
</script>`;
}

function generateAngularForm(
  config: FormConfiguration,
  lang: 'typescript' | 'javascript' | 'python' | 'php' | 'ruby' | 'go' | 'java',
  styling: string
): string {
  const includedFields = config.fieldConfigs.filter((f) => f.included);
  
  return `import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-${config.name.toLowerCase().replace(/\s+/g, '-')}-form',
  templateUrl: './${config.name.toLowerCase().replace(/\s+/g, '-')}-form.component.html',
  styleUrls: ['./${config.name.toLowerCase().replace(/\s+/g, '-')}-form.component.css']
})
export class ${config.name.replace(/\s+/g, '')}FormComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
${includedFields.map(f => `      ${f.path.replace(/\./g, '_')}: [${JSON.stringify(f.defaultValue || '')}${f.required ? ', Validators.required' : ''}]`).join(',\n')}
    });
  }

  onSubmit() {
    console.log('Form data:', this.form.value);
  }
}`;
}

function generateHTMLForm(
  config: FormConfiguration,
  styling: string
): string {
  const includedFields = config.fieldConfigs.filter((f) => f.included);
  
  const fields = includedFields.map((field) => {
    let input = '';
    switch (field.type) {
      case 'boolean':
        input = `<input type="checkbox" name="${field.path}" id="${field.path}" ${field.required ? 'required' : ''}>`;
        break;
      case 'number':
        input = `<input type="number" name="${field.path}" id="${field.path}" ${field.required ? 'required' : ''}>`;
        break;
      case 'date':
        input = `<input type="date" name="${field.path}" id="${field.path}" ${field.required ? 'required' : ''}>`;
        break;
      case 'email':
        input = `<input type="email" name="${field.path}" id="${field.path}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>`;
        break;
      default:
        input = `<input type="text" name="${field.path}" id="${field.path}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>`;
    }
    
    return `    <div>
      <label for="${field.path}">${field.label}</label>
      ${input}
    </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <title>${config.name}</title>
</head>
<body>
  <form id="${config.name.toLowerCase().replace(/\s+/g, '-')}-form">
    <h2>${config.name}</h2>
${fields}
    <button type="submit">Submit</button>
  </form>
</body>
</html>`;
}

function generateReactHookForm(
  config: FormConfiguration,
  lang: 'typescript' | 'javascript' | 'python' | 'php' | 'ruby' | 'go' | 'java',
  styling: string
): string {
  const isTS = lang === 'typescript';
  const includedFields = config.fieldConfigs.filter((f) => f.included);
  
  return `import { useForm } from 'react-hook-form';
${styling === 'mui' ? "import { TextField, Button } from '@mui/material';" : ''}

export function ${config.name.replace(/\s+/g, '')}Form() {
  const { register, handleSubmit, formState: { errors } } = useForm${isTS ? '<FormData>' : ''}();

  const onSubmit = (data${isTS ? ': FormData' : ''}) => {
    console.log('Form data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
${includedFields.map(f => {
  const fieldName = f.path.replace(/\./g, '_');
  return `      <TextField
        {...register('${fieldName}', { required: ${f.required} })}
        label="${f.label}"
        error={!!errors.${fieldName}}
        helperText={errors.${fieldName}?.message}
      />`;
}).join('\n')}
      <Button type="submit" variant="contained">
        Submit
      </Button>
    </form>
  );
}`;
}

// Next.js Form Generator
function generateNextJSForm(
  config: FormConfiguration,
  lang: 'typescript' | 'javascript' | 'python' | 'php' | 'ruby' | 'go' | 'java',
  styling: string
): string {
  const isTS = lang === 'typescript';
  const includedFields = config.fieldConfigs.filter((f) => f.included);
  const componentName = config.name.replace(/\s+/g, '');
  const needsConditionalLogic = hasAnyConditionalLogic(includedFields);

  // Generate fields with conditional wrappers
  const fields = includedFields.map((field) => {
    const fieldJsx = generateReactField(field, styling);
    const visibilityCheck = generateFieldVisibilityCheck(field);

    if (visibilityCheck) {
      return `{(${visibilityCheck}) && (\n        ${fieldJsx}\n      )}`;
    }
    return fieldJsx;
  }).join('\n\n      ');

  const conditionalHelpers = needsConditionalLogic ? generateConditionalLogicHelper(isTS) : '';

  return `'use client';

import { useState } from 'react';
${styling === 'mui' ? "import { Box, TextField, Button, Switch, FormControlLabel } from '@mui/material';" : ''}

export default function ${componentName}Form() {
  const [formData, setFormData] = useState${isTS ? '<Record<string, any>>' : ''}({
${includedFields.map(f => `    ${f.path.replace(/\./g, '_')}: ${JSON.stringify(f.defaultValue || '')}`).join(',\n')}
  });

  const handleChange = (path: string, value${isTS ? ': any' : ''}) => {
    setFormData((prev) => {
      const newData = { ...prev };
      setNestedValue(newData, path, value);
      return newData;
    });
  };

  const setNestedValue = (obj${isTS ? ': any' : ''}, path: string, value${isTS ? ': any' : ''}) => {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((acc, key) => {
      if (!acc[key]) acc[key] = {};
      return acc[key];
    }, obj);
    target[lastKey] = value;
  };
${conditionalHelpers}
  const handleSubmit = async (e${isTS ? ': React.FormEvent' : ''}) => {
    e.preventDefault();
    const response = await fetch('/api/${config.collection}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const result = await response.json();
    console.log('Form submitted:', result);
  };

  return (
    <form onSubmit={handleSubmit}>
      ${fields}
      <Button type="submit" variant="contained" sx={{ mt: 2 }}>
        Submit
      </Button>
    </form>
  );
}
`;
}

// Svelte Form Generator
function generateSvelteForm(
  config: FormConfiguration,
  lang: 'typescript' | 'javascript' | 'python' | 'php' | 'ruby' | 'go' | 'java',
  styling: string
): string {
  const isTS = lang === 'typescript';
  const includedFields = config.fieldConfigs.filter((f) => f.included);
  const componentName = config.name.replace(/\s+/g, '');
  
  return `<script ${isTS ? 'lang="ts"' : ''}>
  let formData${isTS ? ': Record<string, any>' : ''} = {
${includedFields.map(f => `    ${f.path.replace(/\./g, '_')}: ${JSON.stringify(f.defaultValue || '')}`).join(',\n')}
  };

  function handleChange(path: string, value${isTS ? ': any' : ''}) {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let target = formData;
    for (const key of keys) {
      if (!target[key]) target[key] = {};
      target = target[key];
    }
    target[lastKey] = value;
    formData = formData; // Trigger reactivity
  }

  async function handleSubmit() {
    const response = await fetch('/api/${config.collection}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const result = await response.json();
    console.log('Form submitted:', result);
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
${includedFields.map(f => {
  const fieldName = f.path.replace(/\./g, '_');
  switch (f.type) {
    case 'boolean':
      return `  <label>
    <input type="checkbox" bind:checked={formData.${fieldName}} />
    ${f.label}
  </label>`;
    case 'number':
      return `  <label>
    ${f.label}
    <input type="number" bind:value={formData.${fieldName}} />
  </label>`;
    case 'date':
      return `  <label>
    ${f.label}
    <input type="date" bind:value={formData.${fieldName}} />
  </label>`;
    default:
      return `  <label>
    ${f.label}
    <input type="text" bind:value={formData.${fieldName}} placeholder="${f.placeholder || ''}" />
  </label>`;
  }
}).join('\n\n')}
  <button type="submit">Submit</button>
</form>
`;
}

// SolidJS Form Generator
function generateSolidJSForm(
  config: FormConfiguration,
  lang: 'typescript' | 'javascript' | 'python' | 'php' | 'ruby' | 'go' | 'java',
  styling: string
): string {
  const isTS = lang === 'typescript';
  const includedFields = config.fieldConfigs.filter((f) => f.included);
  const componentName = config.name.replace(/\s+/g, '');
  
  return `import { createSignal } from 'solid-js';

export default function ${componentName}Form() {
  const [formData, setFormData] = createSignal${isTS ? '<Record<string, any>>' : ''}({
${includedFields.map(f => `    ${f.path.replace(/\./g, '_')}: ${JSON.stringify(f.defaultValue || '')}`).join(',\n')}
  });

  const handleChange = (path: string, value${isTS ? ': any' : ''}) => {
    setFormData((prev) => {
      const newData = { ...prev };
      const keys = path.split('.');
      const lastKey = keys.pop()!;
      let target = newData;
      for (const key of keys) {
        if (!target[key]) target[key] = {};
        target = target[key];
      }
      target[lastKey] = value;
      return newData;
    });
  };

  const handleSubmit = async (e${isTS ? ': Event' : ''}) => {
    e.preventDefault();
    const response = await fetch('/api/${config.collection}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData())
    });
    const result = await response.json();
    console.log('Form submitted:', result);
  };

  return (
    <form onSubmit={handleSubmit}>
${includedFields.map(f => {
  const fieldName = f.path.replace(/\./g, '_');
  return `      <label>
        ${f.label}
        <input
          type="${f.type === 'number' ? 'number' : f.type === 'email' ? 'email' : f.type === 'date' ? 'date' : 'text'}"
          value={formData().${fieldName}}
          onInput={(e) => handleChange('${f.path}', e.currentTarget.value)}
          ${f.required ? 'required' : ''}
        />
      </label>`;
}).join('\n\n')}
      <button type="submit">Submit</button>
    </form>
  );
}
`;
}

// Remix Form Generator
function generateRemixForm(
  config: FormConfiguration,
  lang: 'typescript' | 'javascript' | 'python' | 'php' | 'ruby' | 'go' | 'java',
  styling: string
): string {
  const isTS = lang === 'typescript';
  const includedFields = config.fieldConfigs.filter((f) => f.included);
  const componentName = config.name.replace(/\s+/g, '');
  
  return `import { Form } from '@remix-run/react';
${styling === 'mui' ? "import { TextField, Button } from '@mui/material';" : ''}

export default function ${componentName}Form() {
  return (
    <Form method="post" action="/api/${config.collection}">
${includedFields.map(f => {
  const fieldName = f.path.replace(/\./g, '_');
  switch (f.type) {
    case 'boolean':
      return `      <label>
        <input type="checkbox" name="${fieldName}" />
        ${f.label}
      </label>`;
    case 'number':
      return `      <TextField
        type="number"
        name="${fieldName}"
        label="${f.label}"
        ${f.required ? 'required' : ''}
      />`;
    case 'date':
      return `      <TextField
        type="date"
        name="${fieldName}"
        label="${f.label}"
        ${f.required ? 'required' : ''}
        InputLabelProps={{ shrink: true }}
      />`;
    default:
      return `      <TextField
        name="${fieldName}"
        label="${f.label}"
        placeholder="${f.placeholder || ''}"
        ${f.required ? 'required' : ''}
      />`;
  }
}).join('\n\n')}
      <Button type="submit" variant="contained">
        Submit
      </Button>
    </Form>
  );
}
`;
}

// Python Flask Form Generator
function generatePythonFlaskForm(config: FormConfiguration): string {
  const includedFields = config.fieldConfigs.filter((f) => f.included);
  
  return `from flask import Flask, request, render_template, jsonify
from flask_wtf import FlaskForm
from wtforms import StringField, IntegerField, BooleanField, DateField, EmailField
from wtforms.validators import DataRequired, Optional

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'

class ${config.name.replace(/\s+/g, '')}Form(FlaskForm):
${includedFields.map(f => {
  const fieldName = f.path.replace(/\./g, '_');
  let fieldType = 'StringField';
  if (f.type === 'number') fieldType = 'IntegerField';
  else if (f.type === 'boolean') fieldType = 'BooleanField';
  else if (f.type === 'date') fieldType = 'DateField';
  else if (f.type === 'email') fieldType = 'EmailField';
  
  const validators = f.required ? 'DataRequired()' : 'Optional()';
  return `    ${fieldName} = ${fieldType}('${f.label}', validators=[${validators}])`;
}).join('\n')}

@app.route('/${config.collection}', methods=['GET', 'POST'])
def ${config.collection}_form():
    form = ${config.name.replace(/\s+/g, '')}Form()
    if form.validate_on_submit():
        # Process form data
        data = {
${includedFields.map(f => `            '${f.path}': form.${f.path.replace(/\./g, '_')}.data`).join(',\n')}
        }
        # TODO: Save to MongoDB
        return jsonify({'success': True, 'data': data})
    return render_template('${config.name.toLowerCase().replace(/\s+/g, '_')}_form.html', form=form)

if __name__ == '__main__':
    app.run(debug=True)
`;
}

// Python FastAPI Form Generator
function generatePythonFastAPIForm(config: FormConfiguration): string {
  const includedFields = config.fieldConfigs.filter((f) => f.included);
  
  return `from fastapi import FastAPI, Form, HTTPException
from pydantic import BaseModel${includedFields.some(f => f.type === 'email') ? ', EmailStr' : ''}
from typing import ${includedFields.some(f => f.type === 'boolean') ? 'Optional' : ''}${includedFields.some(f => f.type === 'boolean') ? ', bool' : ''}
from datetime import ${includedFields.some(f => f.type === 'date') ? 'date' : ''}

app = FastAPI()

class ${config.name.replace(/\s+/g, '')}Form(BaseModel):
${includedFields.map(f => {
  const fieldName = f.path.replace(/\./g, '_');
  let fieldType = 'str';
  if (f.type === 'number') fieldType = 'int';
  else if (f.type === 'boolean') fieldType = 'bool';
  else if (f.type === 'date') fieldType = 'date';
  else if (f.type === 'email') fieldType = 'EmailStr';
  
  const optional = f.required ? '' : 'Optional[';
  const optionalClose = f.required ? '' : '] = None';
  return `    ${fieldName}: ${optional}${fieldType}${optionalClose}${f.required ? '' : ''}`;
}).join('\n')}

@app.post("/${config.collection}")
async def create_${config.collection}(form: ${config.name.replace(/\s+/g, '')}Form):
    # TODO: Save to MongoDB
    return {"success": True, "data": form.dict()}

@app.get("/${config.collection}")
async def get_${config.collection}_form():
    return {"message": "Form endpoint", "fields": [${includedFields.map(f => `"${f.path}"`).join(', ')}]}
`;
}

// Python Django Form Generator
function generatePythonDjangoForm(config: FormConfiguration): string {
  const includedFields = config.fieldConfigs.filter((f) => f.included);
  
  return `from django import forms
from django.shortcuts import render
from django.http import JsonResponse

class ${config.name.replace(/\s+/g, '')}Form(forms.Form):
${includedFields.map(f => {
  const fieldName = f.path.replace(/\./g, '_');
  let fieldType = 'forms.CharField';
  if (f.type === 'number') fieldType = 'forms.IntegerField';
  else if (f.type === 'boolean') fieldType = 'forms.BooleanField';
  else if (f.type === 'date') fieldType = 'forms.DateField';
  else if (f.type === 'email') fieldType = 'forms.EmailField';
  
  const required = f.required ? '' : ', required=False';
  const label = `label='${f.label}'`;
  return `    ${fieldName} = ${fieldType}(${label}${required})`;
}).join('\n')}

def ${config.collection}_form(request):
    if request.method == 'POST':
        form = ${config.name.replace(/\s+/g, '')}Form(request.POST)
        if form.is_valid():
            # TODO: Save to MongoDB
            return JsonResponse({'success': True, 'data': form.cleaned_data})
    else:
        form = ${config.name.replace(/\s+/g, '')}Form()
    return render(request, '${config.name.toLowerCase().replace(/\s+/g, '_')}_form.html', {'form': form})
`;
}

// Node.js Express Form Generator
function generateNodeExpressForm(
  config: FormConfiguration,
  lang: 'typescript' | 'javascript' | 'python' | 'php' | 'ruby' | 'go' | 'java'
): string {
  const isTS = lang === 'typescript';
  const includedFields = config.fieldConfigs.filter((f) => f.included);
  
  return `${isTS ? 'import' : 'const'} express = ${isTS ? "require('express')" : "require('express')"};
${isTS ? 'import' : 'const'} { body, validationResult } = ${isTS ? "require('express-validator')" : "require('express-validator')"};

const app = express();
app.use(express.json());

${isTS ? 'interface' : '//'} FormData {
${includedFields.map(f => {
  const fieldName = f.path.replace(/\./g, '_');
  let fieldType = 'string';
  if (f.type === 'number') fieldType = 'number';
  else if (f.type === 'boolean') fieldType = 'boolean';
  else if (f.type === 'date') fieldType = 'string';
  return `  ${fieldName}${f.required ? '' : '?'}: ${fieldType};`;
}).join('\n')}
${isTS ? '}' : ''}

const validationRules = [
${includedFields.map(f => {
  const fieldName = f.path.replace(/\./g, '_');
  const rules = [];
  if (f.required) rules.push('body("' + fieldName + '").notEmpty()');
  if (f.type === 'email') rules.push('body("' + fieldName + '").isEmail()');
  if (f.type === 'number') rules.push('body("' + fieldName + '").isNumeric()');
  return '  ' + (rules.length > 0 ? rules.join('.') : 'body("' + fieldName + '").optional()');
}).join(',\n')}
];

app.post('/${config.collection}', validationRules, (req${isTS ? ': express.Request' : ''}, res${isTS ? ': express.Response' : ''}) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // TODO: Save to MongoDB
  res.json({ success: true, data: req.body });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
`;
}

// PHP Form Generator
function generatePHPForm(config: FormConfiguration): string {
  const includedFields = config.fieldConfigs.filter((f) => f.included);
  
  return `<?php
header('Content-Type: application/json');

class ${config.name.replace(/\s+/g, '')}Form {
${includedFields.map(f => {
  const fieldName = f.path.replace(/\./g, '_');
  return `    private $${fieldName};`;
}).join('\n')}

    public function __construct($data) {
${includedFields.map(f => {
  const fieldName = f.path.replace(/\./g, '_');
  return `        $this->${fieldName} = $data['${fieldName}'] ?? null;`;
}).join('\n')}
    }

    public function validate() {
        $errors = [];
${includedFields.map(f => {
  const fieldName = f.path.replace(/\./g, '_');
  if (f.required) {
    return `        if (empty($this->${fieldName})) {
            $errors[] = '${f.label} is required';
        }`;
  }
  return '';
}).filter(Boolean).join('\n')}
        return $errors;
    }

    public function toArray() {
        return [
${includedFields.map(f => {
  const fieldName = f.path.replace(/\./g, '_');
  return `            '${f.path}' => $this->${fieldName}`;
}).join(',\n')}
        ];
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $form = new ${config.name.replace(/\s+/g, '')}Form($_POST);
    $errors = $form->validate();
    
    if (empty($errors)) {
        // TODO: Save to MongoDB
        echo json_encode(['success' => true, 'data' => $form->toArray()]);
    } else {
        echo json_encode(['success' => false, 'errors' => $errors]);
    }
}
?>
`;
}

// Ruby on Rails Form Generator
function generateRubyRailsForm(config: FormConfiguration): string {
  const includedFields = config.fieldConfigs.filter((f) => f.included);
  const modelName = config.name.replace(/\s+/g, '');
  const modelNameLower = modelName.toLowerCase();
  
  return `class ${modelName}Controller < ApplicationController
  def create
    @${modelNameLower} = ${modelName}.new(${modelNameLower}_params)
    
    if @${modelNameLower}.save
      render json: { success: true, data: @${modelNameLower} }
    else
      render json: { success: false, errors: @${modelNameLower}.errors }
    end
  end

  private

  def ${modelNameLower}_params
    params.require(:${modelNameLower}).permit(${includedFields.map(f => `:${f.path.replace(/\./g, '_')}`).join(', ')})
  end
end

# app/models/${modelNameLower}.rb
class ${modelName} < ApplicationRecord
${includedFields.filter(f => f.required).map(f => {
  const fieldName = f.path.replace(/\./g, '_');
  return `  validates :${fieldName}, presence: true`;
}).join('\n')}
end
`;
}

// Go Gin Form Generator
function generateGoGinForm(config: FormConfiguration): string {
  const includedFields = config.fieldConfigs.filter((f) => f.included);
  const structName = config.name.replace(/\s+/g, '');
  
  return `package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

type ${structName}Form struct {
${includedFields.map(f => {
  const fieldName = f.path.replace(/\./g, '_');
  const goName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  let goType = 'string';
  if (f.type === 'number') goType = 'int';
  else if (f.type === 'boolean') goType = 'bool';
  const jsonTag = f.required ? '"${f.path}" binding:"required"' : '"${f.path}"';
  return `    ${goName} ${goType} \`json:${jsonTag}\``;
}).join('\n')}
}

func main() {
    r := gin.Default()
    
    r.POST("/${config.collection}", func(c *gin.Context) {
        var form ${structName}Form
        if err := c.ShouldBindJSON(&form); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        
        // TODO: Save to MongoDB
        c.JSON(http.StatusOK, gin.H{"success": true, "data": form})
    })
    
    r.Run(":8080")
}
`;
}

// Java Spring Form Generator
function generateJavaSpringForm(config: FormConfiguration): string {
  const includedFields = config.fieldConfigs.filter((f) => f.included);
  const className = config.name.replace(/\s+/g, '');
  
  return `package com.example.form;

import org.springframework.web.bind.annotation.*;
import javax.validation.constraints.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/${config.collection}")
public class ${className}Controller {
    
    @PostMapping
    public ResponseEntity<${className}Response> create(@RequestBody @Valid ${className}Form form) {
        // TODO: Save to MongoDB
        return ResponseEntity.ok(new ${className}Response(true, form));
    }
}

class ${className}Form {
${includedFields.map(f => {
  const fieldName = f.path.replace(/\./g, '_');
  const javaName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  let javaType = 'String';
  if (f.type === 'number') javaType = 'Integer';
  else if (f.type === 'boolean') javaType = 'Boolean';
  else if (f.type === 'date') javaType = 'LocalDate';
  
  const annotations = [];
  if (f.required) annotations.push('@NotNull');
  if (f.type === 'email') annotations.push('@Email');
  
  return `    ${annotations.length > 0 ? annotations.join('\n    ') + '\n    ' : ''}private ${javaType} ${fieldName};`;
}).join('\n\n')}
    
    // Getters and setters
${includedFields.map(f => {
  const fieldName = f.path.replace(/\./g, '_');
  const javaName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  let javaType = 'String';
  if (f.type === 'number') javaType = 'Integer';
  else if (f.type === 'boolean') javaType = 'Boolean';
  else if (f.type === 'date') javaType = 'LocalDate';
  
  return `    public ${javaType} get${javaName}() { return ${fieldName}; }
    public void set${javaName}(${javaType} ${fieldName}) { this.${fieldName} = ${fieldName}; }`;
}).join('\n\n')}
}

class ${className}Response {
    private boolean success;
    private ${className}Form data;

    public ${className}Response(boolean success, ${className}Form data) {
        this.success = success;
        this.data = data;
    }

    // Getters and setters
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public ${className}Form getData() { return data; }
    public void setData(${className}Form data) { this.data = data; }
}
`;
}

// Zod Schema Generator
function generateZodSchema(config: FormConfiguration): string {
  const includedFields = config.fieldConfigs.filter((f) => f.included);
  const schemaName = config.name.replace(/\s+/g, '');

  const fields = includedFields.map((f) => {
    const fieldName = f.path.replace(/\./g, '_');
    let zodType = getZodType(f);

    // Add validation modifiers
    if (f.validation?.min !== undefined && (f.type === 'number')) {
      zodType += `.min(${f.validation.min})`;
    }
    if (f.validation?.max !== undefined && (f.type === 'number')) {
      zodType += `.max(${f.validation.max})`;
    }
    if (f.validation?.minLength !== undefined) {
      zodType += `.min(${f.validation.minLength})`;
    }
    if (f.validation?.maxLength !== undefined) {
      zodType += `.max(${f.validation.maxLength})`;
    }
    if (f.validation?.pattern) {
      zodType += `.regex(/${f.validation.pattern}/)`;
    }

    // Make optional if not required
    if (!f.required) {
      zodType += '.optional()';
    }

    return `  ${fieldName}: ${zodType}`;
  });

  return `import { z } from 'zod';

// Generated Zod schema for ${config.name}
// Collection: ${config.collection}

export const ${schemaName}Schema = z.object({
${fields.join(',\n')}
});

// Infer TypeScript type from schema
export type ${schemaName}FormData = z.infer<typeof ${schemaName}Schema>;

// Validation function
export function validate${schemaName}(data: unknown): ${schemaName}FormData {
  return ${schemaName}Schema.parse(data);
}

// Safe validation (returns result object instead of throwing)
export function safeValidate${schemaName}(data: unknown) {
  return ${schemaName}Schema.safeParse(data);
}
`;
}

function getZodType(field: FieldConfig): string {
  switch (field.type) {
    case 'string':
      return 'z.string()';
    case 'number':
      return 'z.number()';
    case 'boolean':
      return 'z.boolean()';
    case 'date':
      return 'z.string().datetime()'; // or z.date() if using Date objects
    case 'email':
      return 'z.string().email()';
    case 'url':
      return 'z.string().url()';
    case 'array':
      return 'z.array(z.string())';
    case 'array-object':
      return 'z.array(z.record(z.unknown()))';
    case 'object':
      return 'z.record(z.unknown())';
    default:
      return 'z.string()';
  }
}

// Yup Schema Generator
function generateYupSchema(config: FormConfiguration): string {
  const includedFields = config.fieldConfigs.filter((f) => f.included);
  const schemaName = config.name.replace(/\s+/g, '');

  const fields = includedFields.map((f) => {
    const fieldName = f.path.replace(/\./g, '_');
    let yupType = getYupType(f);

    // Add validation modifiers
    if (f.validation?.min !== undefined && f.type === 'number') {
      yupType += `.min(${f.validation.min}, '${f.label} must be at least ${f.validation.min}')`;
    }
    if (f.validation?.max !== undefined && f.type === 'number') {
      yupType += `.max(${f.validation.max}, '${f.label} must be at most ${f.validation.max}')`;
    }
    if (f.validation?.minLength !== undefined) {
      yupType += `.min(${f.validation.minLength}, '${f.label} must be at least ${f.validation.minLength} characters')`;
    }
    if (f.validation?.maxLength !== undefined) {
      yupType += `.max(${f.validation.maxLength}, '${f.label} must be at most ${f.validation.maxLength} characters')`;
    }
    if (f.validation?.pattern) {
      yupType += `.matches(/${f.validation.pattern}/, '${f.label} format is invalid')`;
    }

    // Add required or optional
    if (f.required) {
      yupType += `.required('${f.label} is required')`;
    } else {
      yupType += '.optional()';
    }

    return `  ${fieldName}: ${yupType}`;
  });

  return `import * as yup from 'yup';

// Generated Yup schema for ${config.name}
// Collection: ${config.collection}

export const ${schemaName}Schema = yup.object({
${fields.join(',\n')}
});

// Infer TypeScript type from schema
export type ${schemaName}FormData = yup.InferType<typeof ${schemaName}Schema>;

// Validation function
export async function validate${schemaName}(data: unknown): Promise<${schemaName}FormData> {
  return ${schemaName}Schema.validate(data);
}

// Sync validation (throws on error)
export function validate${schemaName}Sync(data: unknown): ${schemaName}FormData {
  return ${schemaName}Schema.validateSync(data);
}

// Check if valid without throwing
export function isValid${schemaName}(data: unknown): boolean {
  return ${schemaName}Schema.isValidSync(data);
}
`;
}

function getYupType(field: FieldConfig): string {
  switch (field.type) {
    case 'string':
      return 'yup.string()';
    case 'number':
      return 'yup.number()';
    case 'boolean':
      return 'yup.boolean()';
    case 'date':
      return 'yup.date()';
    case 'email':
      return 'yup.string().email()';
    case 'url':
      return 'yup.string().url()';
    case 'array':
      return 'yup.array().of(yup.string())';
    case 'array-object':
      return 'yup.array().of(yup.object())';
    case 'object':
      return 'yup.object()';
    default:
      return 'yup.string()';
  }
}

// TypeScript Types Generator
function generateTypeScriptTypes(config: FormConfiguration): string {
  const includedFields = config.fieldConfigs.filter((f) => f.included);
  const typeName = config.name.replace(/\s+/g, '');

  // Group fields by nesting level for proper interface generation
  const topLevelFields: FieldConfig[] = [];
  const nestedFields: Map<string, FieldConfig[]> = new Map();

  includedFields.forEach((f) => {
    if (f.path.includes('.')) {
      const parentPath = f.path.split('.').slice(0, -1).join('.');
      if (!nestedFields.has(parentPath)) {
        nestedFields.set(parentPath, []);
      }
      nestedFields.get(parentPath)!.push(f);
    } else {
      topLevelFields.push(f);
    }
  });

  const fields = includedFields.map((f) => {
    const fieldName = f.path.replace(/\./g, '_');
    const tsType = getTsType(f);
    const optional = f.required ? '' : '?';
    const comment = f.validation ? generateValidationComment(f) : '';

    return `${comment}  ${fieldName}${optional}: ${tsType};`;
  });

  // Generate conditional logic types if any fields have conditions
  const conditionalFields = includedFields.filter(
    (f) => f.conditionalLogic && f.conditionalLogic.conditions.length > 0
  );

  let conditionalTypesSection = '';
  if (conditionalFields.length > 0) {
    conditionalTypesSection = `

// Conditional field visibility rules
export interface ${typeName}ConditionalRules {
${conditionalFields.map((f) => {
  const fieldName = f.path.replace(/\./g, '_');
  const logic = f.conditionalLogic!;
  return `  ${fieldName}: {
    action: '${logic.action}';
    logicType: '${logic.logicType}';
    conditions: Array<{
      field: string;
      operator: '${logic.conditions.map((c) => c.operator).join("' | '")}';
      value?: unknown;
    }>;
  };`;
}).join('\n')}
}`;
  }

  return `// Generated TypeScript types for ${config.name}
// Collection: ${config.collection}
// Generated at: ${new Date().toISOString()}

/**
 * Form data interface for ${config.name}
 */
export interface ${typeName}FormData {
${fields.join('\n')}
}

/**
 * Partial form data (for updates)
 */
export type ${typeName}PartialFormData = Partial<${typeName}FormData>;

/**
 * Form field configuration
 */
export interface ${typeName}FieldConfig {
  path: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

/**
 * Default values for form initialization
 */
export const ${typeName}DefaultValues: ${typeName}FormData = {
${includedFields.map((f) => {
  const fieldName = f.path.replace(/\./g, '_');
  return `  ${fieldName}: ${JSON.stringify(f.defaultValue ?? getDefaultForType(f.type))}`;
}).join(',\n')}
};${conditionalTypesSection}
`;
}

function getTsType(field: FieldConfig): string {
  switch (field.type) {
    case 'string':
    case 'email':
    case 'url':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
      return 'string'; // ISO date string, or use Date if preferred
    case 'array':
      return 'string[]';
    case 'array-object':
      return 'Record<string, unknown>[]';
    case 'object':
      return 'Record<string, unknown>';
    default:
      return 'unknown';
  }
}

function getDefaultForType(type: string): unknown {
  switch (type) {
    case 'string':
    case 'email':
    case 'url':
    case 'date':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'array':
    case 'array-object':
      return [];
    case 'object':
      return {};
    default:
      return null;
  }
}

function generateValidationComment(field: FieldConfig): string {
  const rules: string[] = [];

  if (field.validation?.min !== undefined) {
    rules.push(`min: ${field.validation.min}`);
  }
  if (field.validation?.max !== undefined) {
    rules.push(`max: ${field.validation.max}`);
  }
  if (field.validation?.minLength !== undefined) {
    rules.push(`minLength: ${field.validation.minLength}`);
  }
  if (field.validation?.maxLength !== undefined) {
    rules.push(`maxLength: ${field.validation.maxLength}`);
  }
  if (field.validation?.pattern) {
    rules.push(`pattern: ${field.validation.pattern}`);
  }

  if (rules.length === 0) return '';

  return `  /** Validation: ${rules.join(', ')} */\n`;
}

