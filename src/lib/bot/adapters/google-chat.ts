import { processCommonChatService, IncomingBotMessage, BotResponse } from '../common-chat-service';

export async function handleGoogleChatWebhook(body: any): Promise<BotResponse | null> {
  if (!body) return null;

  // Google Chat Event Structure (MESSAGE, CARD_CLICKED, ADDED_TO_SPACE)
  const user = body.user || body.message?.sender;
  const senderId = String(user?.name || user?.email || 'unknown_gchat_user');
  const senderName = user?.displayName || 'Google Chat User';
  const text = body.message?.text || body.action?.actionMethodName || 'analyze';

  const incomingMessage: IncomingBotMessage = {
    platform: 'google-chat',
    senderId,
    senderName,
    text,
  };

  return processCommonChatService(incomingMessage);
}
