export interface HoyoverseGameItem {
    ACT_ID: string;
    success: string;
    signed: string;
    gameId: number;
    gameName: string;
    assets: {
        author: string;
        gameName: string;
        icon: string;
    };
    url: {
        info: string;
        home: string;
        sign: string;
        redem?: string;
        checkCodeWeb?: string[];
    };
}
