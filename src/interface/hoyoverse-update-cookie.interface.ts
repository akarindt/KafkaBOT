export interface UpdateHoyolabCookieResponse {
    code: number;
    data?: {
        cookie_info: {
            account_id: number;
            account_name: string;
            area_code: string;
            cookie_token: string;
            cur_time: number;
            email: string;
            mobile: string;
        };
        info: string;
        msg: string;
        sign: string;
        status: number;
    };
}
