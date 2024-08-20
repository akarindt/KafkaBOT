import { BotClient } from '@/infrastructure/client';
import { StartHoyolabCheckInJob } from './hoyolab';

export default async function InitializeJob(client: BotClient) {
    await StartHoyolabCheckInJob(client);
}
