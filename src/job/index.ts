import { BotClient } from '@/infrastructure/client';
import HoyolabJob from './hoyolab';
import schedule from 'node-schedule';

export default class Job {
    private _client: BotClient;

    constructor(client: BotClient) {
        this._client = client;
    }

    public async Initialize() {
        console.log('[INFO] Shut down all previous job')
        await schedule.gracefulShutdown();
        
        // Hoyolab
        const HyJob = new HoyolabJob(this._client);
        await HyJob.StartCheckCodeJob();
        await HyJob.StartHoyolabCheckInJob();
        await HyJob.StartHoyolabAutoRedeem();
        // End Hoyolab

    }
}
