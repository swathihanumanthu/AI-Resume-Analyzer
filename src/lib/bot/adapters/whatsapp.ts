import { processCommonChatService, IncomingBotMessage, BotResponse } from '../common-chat-service';

export async function handleWhatsAppWebhook(body: any): Promise<BotResponse | null> {
  if (!body) return null;

  const value = body.entry?.[0]?.changes?.[0]?.value || body;
  const message = value.messages?.[0] || body.message;
  if (!message && !body.text) return null;

  const senderId = String(message?.from || body.from || 'unknown_wa_user');
  const senderName = value.contacts?.[0]?.profile?.name || body.name || 'WhatsApp User';
  const text = message?.text?.body || message?.button?.text || message?.interactive?.button_reply?.title || body.text || 'START';

  const incomingMessage: IncomingBotMessage = {
    platform: 'whatsapp',
    senderId,
    senderName,
    text,
  };

  const response = await processCommonChatService(incomingMessage);

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (accessToken && phoneNumberId && senderId && response) {
    try {
      await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: senderId,
          type: 'text',
          text: { body: response.replyText },
        }),
      });
    } catch (err) {
      console.error('Error sending WhatsApp Cloud API message:', err);
    }
  }

  return response;
}
