import { NextRequest, NextResponse } from 'next/server';
import LlamaService from '@/lib/llama-service';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // console.log('Processing chat request:', { message: message.substring(0, 100) + '...' });

    const llamaService = LlamaService.getInstance();
    const response = await llamaService.getResponse(message);

    // console.log('Chat response generated successfully');

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in chat API route:', error);
    
    // Return a more specific error message
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Test endpoint to check if the service is working
export async function GET() {
  try {
    // console.log('Testing service...');
    
    const llamaService = LlamaService.getInstance();
    const response = await llamaService.getResponse("test message");
    
    // console.log('Service test successful');

    return NextResponse.json({ 
      success: true, 
      message: "Service is working",
      response: response.substring(0, 100) + "..."
    });
  } catch (error) {
    console.error('Error testing service:', error);
    return NextResponse.json(
      { 
        error: 'Service test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 