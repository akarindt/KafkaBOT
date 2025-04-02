import { BotClient } from '@/infrastructure/client';
import HoyolabJob from './hoyolab';
import WutheringWavesJob from './wutheringwaves';

export default class Job {
    private _client: BotClient;

    constructor(client: BotClient) {
        this._client = client;
    }

    public async Initialize() {
        // Hoyolab
        const HyJob = new HoyolabJob(this._client);
        await HyJob.StartCheckCodeJob();
        await HyJob.StartHoyolabCheckInJob();
        await HyJob.StartHoyolabAutoRedeem();
        // End Hoyolab

        const WuwaJob = new WutheringWavesJob(this._client);
        await WuwaJob.StartCodeChecking();
    }
}
