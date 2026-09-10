import { processCommonChatService, IncomingBotMessage, BotResponse } from '../common-chat-service';

export async function handleWhatsAppWebhook(body: any): Promise<BotResponse | null> {
  if (!body || !body.entry?.[0]?.changes?.[0]?.value) return null;

  const value = body.entry[0].changes[0].value;
  const message = value.messages?.[0];
  if (!message) return null;

  const senderId = String(message.from || 'unknown_wa_user');
  const senderName = value.contacts?.[0]?.profile?.name || 'WhatsApp User';
  const text = message.text?.body || message.button?.text || message.interactive?.button_reply?.title || 'analyze';

  const incomingMessage: IncomingBotMessage = {
    platform: 'whatsapp',
    senderId,
    senderName,
    text,
  };

  return processCommonChatService(incomingMessage);
}
