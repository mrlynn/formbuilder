/**
 * AI Formula Generation API Endpoint
 *
 * POST /api/ai/generate-formula
 * Generates a formula from natural language description.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createFormulaAssistant } from '@/lib/ai/formulaAssistant';
import { GenerateFormulaRequest } from '@/lib/ai/types';
import { validateAIRequest, recordAIUsage } from '@/lib/ai/aiRequestGuard';

export async function POST(request: NextRequest) {
  try {
    // Validate authentication, feature access, and usage limits
    const guard = await validateAIRequest('ai_formula_assistant');
    if (!guard.success) {
      return guard.response;
    }

    const body = await request.json();

    // Validate request
    if (!body.description || typeof body.description !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Description is required and must be a string' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.availableFields)) {
      return NextResponse.json(
        { success: false, error: 'availableFields array is required' },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'AI service is not configured. Please set OPENAI_API_KEY.' },
        { status: 503 }
      );
    }

    const assistant = createFormulaAssistant(apiKey);

    const formulaRequest: GenerateFormulaRequest = {
      description: body.description,
      availableFields: body.availableFields,
      outputType: body.outputType,
    };

    const result = await assistant.generateFormula(formulaRequest);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 422 }
      );
    }

    // Increment usage counter on successful generation
    await recordAIUsage(guard.context.orgId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Formula generation API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
