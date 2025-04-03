export interface HoyoverseAccountData {
    list: {
        has_role: boolean;
        game_id: number;
        game_role_id: string;
        nickname: string;
        region: string;
        level: number;
        background_image: string;
        is_public: boolean;
        data: {
            name: string;
            type: number;
            value: string;
        }[];
        region_name: string;
        url: string;
        data_switches: {
            switch_id: number;
            is_public: boolean;
            switch_name: string;
        }[];
        h5_data_switches: unknown[];
        background_color: string;
        background_image_v2: string;
        logo: string;
        game_name: string;
    }[];
}
