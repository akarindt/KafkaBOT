export interface HoyoverseAwardData {
    month: number;
    awards: {
        icon: string;
        name: string;
        cnt: number;
    }[];
    biz: string;
    resign: boolean;
    short_extra_reward: {
        has_extra_award: boolean;
        start_time: string;
        end_time: string;
        list: {
            icon: string;
            name: string;
            cnt: number;
            sign_date: number;
            high_light: boolean;
        }[];
        start_timestamp: string;
        end_timestamp: string;
    };
}
