import { BotClient } from '@infrastructure/client.infrastructure';
import HoyolabJob from './hoyolab.job';
import WutheringWavesJob from './wuthering-waves.job';

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
