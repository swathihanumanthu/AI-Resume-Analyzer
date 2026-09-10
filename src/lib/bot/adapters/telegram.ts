import { processCommonChatService, IncomingBotMessage, BotResponse } from '../common-chat-service';

export async function handleTelegramWebhook(body: any): Promise<BotResponse | null> {
  if (!body || !body.message) return null;

  const msg = body.message;
  const senderId = String(msg.from?.id || 'unknown_tg_user');
  const senderName = msg.from?.first_name || 'Telegram User';
  const text = msg.text || msg.caption || '/start';

  const incomingMessage: IncomingBotMessage = {
    platform: 'telegram',
    senderId,
    senderName,
    text,
  };

  return processCommonChatService(incomingMessage);
}

export async function handleDiscordWebhook(body: any): Promise<BotResponse | null> {
  if (!body) return null;

  // Discord interaction structure
  const senderId = body.member?.user?.id || body.author?.id || 'unknown_discord_user';
  const senderName = body.member?.user?.username || body.author?.username || 'Discord User';
  const text = body.data?.options?.[0]?.value || body.content || 'analyze';

  const incomingMessage: IncomingBotMessage = {
    platform: 'discord',
    senderId,
    senderName,
    text,
  };

  return processCommonChatService(incomingMessage);
}

export async function handleSlackWebhook(body: any): Promise<BotResponse | null> {
  if (!body) return null;
  const event = body.event || body;
  const senderId = event.user || 'unknown_slack_user';
  const senderName = 'Slack User';
  const text = event.text || 'analyze';

  const incomingMessage: IncomingBotMessage = {
    platform: 'slack',
    senderId,
    senderName,
    text,
  };

  return processCommonChatService(incomingMessage);
}
