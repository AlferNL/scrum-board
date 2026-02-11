import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route to proxy Teams webhook requests
 * This avoids CORS issues by making the request server-side
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookUrl, message } = body;

    if (!webhookUrl || !message) {
      return NextResponse.json(
        { error: 'webhookUrl and message are required' },
        { status: 400 }
      );
    }

    // Make the request from the server (no CORS issues)
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Webhook failed', status: response.status, details: errorText },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
