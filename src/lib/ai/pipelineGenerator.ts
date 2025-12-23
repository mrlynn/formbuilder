import { SerializedStage } from '@/lib/pipelineSerializer';
import { StageDefinition } from '@/types/pipeline';
import { stageDefinitions } from '@/lib/stageDefinitions';

// Ensure this module only runs on the server
if (typeof window !== 'undefined') {
  throw new Error('pipelineGenerator can only be used on the server');
}

// Dynamic import for OpenAI to avoid client-side bundling issues
async function getOpenAIClient() {
  const { default: OpenAI } = await import('openai');
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  return new OpenAI({
    apiKey: apiKey
  });
}

export interface PipelineGenerationRequest {
  query: string;
  collectionName?: string;
  schema?: {
    fields: string[];
    sampleDocs?: any[];
  };
  existingPipeline?: SerializedStage[];
}

export interface PipelineGenerationResponse {
  stages: SerializedStage[];
  explanation?: string;
  confidence?: number;
}

const SYSTEM_PROMPT = `You are an expert MongoDB aggregation pipeline builder. Your task is to convert natural language queries into valid MongoDB aggregation pipeline stages.

Available aggregation stages:
${stageDefinitions.map(s => `- ${s.type}: ${s.description}`).join('\n')}

Rules:
1. Return ONLY valid JSON in this exact format:
{
  "stages": [
    {"$match": {"field": "value"}},
    {"$group": {"_id": "$field", "count": {"$sum": 1}}},
    {"$sort": {"count": -1}}
  ],
  "explanation": "Brief explanation of the pipeline"
}

2. Use proper MongoDB syntax:
   - Field paths start with $ (e.g., "$status", "$customer.name")
   - Operators start with $ (e.g., "$sum", "$avg", "$gte")
   - Use correct data types (numbers, strings, booleans, dates)

3. Generate complete, working pipelines with all necessary configurations

4. If the query is ambiguous, make reasonable assumptions and explain them

5. Always return valid JSON - no markdown, no code blocks, just pure JSON`;

export async function generatePipelineFromQuery(
  request: PipelineGenerationRequest
): Promise<PipelineGenerationResponse> {
  const userPrompt = buildUserPrompt(request);

  try {
    const client = await getOpenAIClient();
    
    const completion = await client.chat.completions.create({
      model: 'gpt-4o', // Using GPT-4o, can fallback to gpt-4-turbo or gpt-5.2 if available
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent, accurate results
      response_format: { type: 'json_object' }
    } as any); // Type assertion to handle potential type issues

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response - handle potential markdown code blocks
    let jsonContent = content.trim();
    // Remove markdown code blocks if present
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    let parsed: any;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', jsonContent);
      throw new Error(`Failed to parse AI response as JSON: ${parseError}`);
    }
    
    // Validate the response structure
    if (!parsed.stages || !Array.isArray(parsed.stages)) {
      throw new Error('Invalid response format: missing stages array');
    }

    return {
      stages: parsed.stages,
      explanation: parsed.explanation,
      confidence: parsed.confidence
    };
  } catch (error: any) {
    console.error('Error generating pipeline:', error);
    // Re-throw with a more user-friendly message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to generate pipeline: ${String(error)}`);
  }
}

function buildUserPrompt(request: PipelineGenerationRequest): string {
  let prompt = `Convert this natural language query into a MongoDB aggregation pipeline:\n\n"${request.query}"\n\n`;

  if (request.collectionName) {
    prompt += `Collection name: ${request.collectionName}\n`;
  }

  if (request.schema) {
    prompt += `\nAvailable fields: ${request.schema.fields.join(', ')}\n`;
    
    if (request.schema.sampleDocs && request.schema.sampleDocs.length > 0) {
      prompt += `\nSample document structure:\n${JSON.stringify(request.schema.sampleDocs[0], null, 2)}\n`;
    }
  }

  if (request.existingPipeline && request.existingPipeline.length > 0) {
    prompt += `\nExisting pipeline (extend or modify this):\n${JSON.stringify(request.existingPipeline, null, 2)}\n`;
    prompt += `\nNote: The user wants to extend or modify the existing pipeline based on their query.`;
  }

  prompt += `\n\nGenerate a complete, valid MongoDB aggregation pipeline that fulfills the query.`;

  return prompt;
}

