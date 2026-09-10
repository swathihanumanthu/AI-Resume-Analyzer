import { NextRequest, NextResponse } from 'next/server';
import { processCommonChatService } from '../../../lib/bot/common-chat-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, senderId, senderName, platform } = body;

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message content is required.' }, { status: 400 });
    }

    const response = await processCommonChatService({
      platform: platform || 'web',
      senderId: senderId || 'web_user',
      senderName: senderName || 'User',
      text: message,
    });

    return NextResponse.json({ success: true, replyText: response.replyText });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Chat processing error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
