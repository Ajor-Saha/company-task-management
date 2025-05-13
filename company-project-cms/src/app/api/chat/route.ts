import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export async function POST(req: Request) {
  try {
    // Parse JSON body
    const { messages } = await req.json();

    if (!messages) {
      return new Response(
        JSON.stringify({ success: false, message: 'Prompt is required' }),
        { status: 400 }
      );
    }

    // Generate text using the AI SDK
    const result = await streamText({
      model: google('gemini-1.5-pro-latest'),
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error generating text:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Something went wrong!' }),
      { status: 500 }
    );
  }
}


