import { NextRequest, NextResponse } from 'next/server';

// Allowed webhook URL patterns (Microsoft Teams/Office 365)
const ALLOWED_WEBHOOK_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.webhook\.office\.com\//i,
  /^https:\/\/[a-z0-9-]+\.logic\.azure\.com\//i,
  /^https:\/\/outlook\.office\.com\/webhook\//i,
];

/**
 * Validate that a URL is a legitimate Microsoft Teams webhook
 * Prevents SSRF attacks by only allowing known Microsoft domains
 */
function isValidTeamsWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Must be HTTPS
    if (parsed.protocol !== 'https:') {
      return false;
    }
    // Check against allowed patterns
    return ALLOWED_WEBHOOK_PATTERNS.some(pattern => pattern.test(url));
  } catch {
    return false;
  }
}

/**
 * API Route to proxy Teams webhook requests
 * This avoids CORS issues by making the request server-side
 * 
 * Security: Only allows requests to verified Microsoft Teams webhook domains
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

    // Security: Validate webhook URL to prevent SSRF attacks
    if (!isValidTeamsWebhookUrl(webhookUrl)) {
      console.warn('Blocked invalid webhook URL:', webhookUrl);
      return NextResponse.json(
        { error: 'Invalid webhook URL. Only Microsoft Teams webhooks are allowed.' },
        { status: 403 }
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
      // Log full error server-side for debugging
      console.error('Webhook error:', response.status, errorText);
      // Return sanitized error to client (don't expose internal details)
      return NextResponse.json(
        { error: 'Webhook delivery failed', status: response.status },
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
