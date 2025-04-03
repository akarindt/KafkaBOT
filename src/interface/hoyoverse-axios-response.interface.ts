export interface HoyoverseAxiosResponse {
    active: {
        code: string;
        rewards: string[];
    }[];
    inactive: {
        code: string;
        rewards: string[];
    }[];
}
