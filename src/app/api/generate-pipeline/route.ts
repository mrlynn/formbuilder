import { NextRequest, NextResponse } from 'next/server';
import { generatePipelineFromQuery, PipelineGenerationRequest } from '@/lib/ai/pipelineGenerator';

export async function POST(request: NextRequest) {
  try {
    const body: PipelineGenerationRequest = await request.json();

    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.' },
        { status: 500 }
      );
    }

    const result = await generatePipelineFromQuery(body);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in generate-pipeline API:', error);
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to generate pipeline';
    if (error.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
      },
      { status: 500 }
    );
  }
}

