import { BotClient } from '@/infrastructure/client';
import * as HoyolabCron from './hoyolab';
import schedule from 'node-schedule';

export default async function InitializeJob(client: BotClient) {
    console.log('[INFO] Shut down all previous job')
    // await schedule.gracefulShutdown();

    // Hoyolab checkin
    // await StartHoyolabCheckInJob(client);
    await HoyolabCron.StartCheckCodeJob();
}
