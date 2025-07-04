import { NextResponse } from 'next/server';
import { getRetriever } from '@/lib/llama-service';

export async function GET() {
  try {
    // console.log('Testing direct retrieval from LlamaCloud...');
    
    const retriever = await getRetriever();
    // console.log('Retriever obtained, testing retrieval...');
    
    const nodes = await retriever.retrieve("hello");
    console.log('Retrieved nodes:', nodes.length);
    
    if (nodes.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "No nodes retrieved - index might be empty or query not matching",
        nodeCount: 0
      });
    }

    return NextResponse.json({ 
      success: true, 
      nodeCount: nodes.length,
      message: `Successfully retrieved ${nodes.length} nodes from the index`,
      firstNodePreview: (nodes[0]?.node as any)?.text?.substring(0, 200) || "No text available"
    });
  } catch (error) {
    console.error('Error testing direct retrieval:', error);
    return NextResponse.json(
      { 
        error: 'Direct retrieval test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 