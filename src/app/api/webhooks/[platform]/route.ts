import { NextRequest, NextResponse } from 'next/server';
import { handleTelegramWebhook, handleDiscordWebhook, handleSlackWebhook } from '../../../../lib/bot/adapters/telegram';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await context.params;
    const body = await req.json().catch(() => ({}));

    // Slack URL Verification Handshake
    if (platform === 'slack' && body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge });
    }

    let response: any = null;

    if (platform === 'telegram') {
      response = await handleTelegramWebhook(body);
    } else if (platform === 'discord') {
      response = await handleDiscordWebhook(body);
    } else if (platform === 'slack') {
      response = await handleSlackWebhook(body);
    } else {
      return NextResponse.json({ success: true, message: `Platform ${platform} webhook received.` });
    }

    if (response) {
      return NextResponse.json({
        success: true,
        text: response.replyText,
        targetId: response.targetId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Webhook handling error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
