import { processCommonChatService, IncomingBotMessage, BotResponse } from '../common-chat-service';

export async function handleDiscordWebhook(body: any): Promise<BotResponse | null> {
  if (!body) return null;

  // Handle Discord Interaction / Slash Command / Message
  const senderId = String(body.member?.user?.id || body.author?.id || body.user?.id || 'unknown_discord_user');
  const senderName = body.member?.user?.username || body.author?.username || body.user?.username || 'Discord User';
  const text = body.data?.options?.[0]?.value || body.data?.name || body.content || '/analyze';

  const incomingMessage: IncomingBotMessage = {
    platform: 'discord',
    senderId,
    senderName,
    text,
  };

  return processCommonChatService(incomingMessage);
}
