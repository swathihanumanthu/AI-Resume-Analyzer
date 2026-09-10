import { processCommonChatService, IncomingBotMessage, BotResponse } from '../common-chat-service';

export async function handleTelegramWebhook(body: any): Promise<BotResponse | null> {
  if (!body) return null;

  // Handle message or inline button callback query
  const msg = body.message || body.callback_query?.message;
  if (!msg) return null;

  const senderId = String(body.callback_query?.from?.id || msg.from?.id || 'unknown_tg_user');
  const senderName = body.callback_query?.from?.first_name || msg.from?.first_name || 'Telegram User';
  const text = body.callback_query?.data || msg.text || msg.caption || '/start';

  const incomingMessage: IncomingBotMessage = {
    platform: 'telegram',
    senderId,
    senderName,
    text,
  };

  return processCommonChatService(incomingMessage);
}
