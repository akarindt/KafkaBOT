import { HoyoverseGame, HoyoverseHeader, HoyoverseRedemptionUrl } from '@/type';

export const PRIMARY_EMBED_COLOR = 0xeb86c6;
export const DEFAULT_SIMILARITY_POINT = 60;
export const ITEM_PER_PAGES = 10;
export const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0';
export const NEGATIVE_PROMPTS = [
    'ugly',
    'duplicate',
    'morbid',
    'mutilated',
    'out of frame',
    'extra fingers',
    'mutated hands',
    'poorly drawn hands',
    'poorly drawn face',
    'mutation',
    'deformed',
    'ugly',
    'blurry',
    'bad anatomy',
    'bad proportions',
    'extra limbs',
    'cloned face',
    'out of frame',
    'ugly',
    'extra limbs',
    'bad anatomy',
    'gross proportions',
    'malformed limbs',
    'missing arms',
    'missing legs',
    'extra arms',
    'extra legs',
    'mutated hands',
    'fused fingers',
    'too many fingers',
    'long neck',
    'extra head',
    'cloned head',
    'extra body',
    'cloned body',
    'watermark',
    'extra hands',
    'clone hands',
    'weird hand',
    'weird finger',
    'weird arm',
    '(mutation:1.3)',
    '(deformed:1.3)',
    '(blurry)',
    '(bad anatomy:1.1)',
    '(bad proportions:1.2)',
    'out of frame',
    'ugly',
    '(long neck:1.2)',
    '(worst quality:1.4)',
    '(low quality:1.4)',
    '(monochrome:1.1)',
    'text',
    'signature',
    'watermark',
    'bad anatomy',
    'disfigured',
    'jpeg artifacts',
    '3d max',
    'grotesque',
    'desaturated',
    'blur',
    'haze',
    'polysyndactyly',
];

export const BOT_IMAGE_FOLDER = 'kafkaBOT';
export const CLOUDINARY_IMAGE_QUALITY = 70;
export const CLOUDINARY_IMAGE_FORMAT = 'webp';
export const CLOUDINARY_IMAGE_WIDTH = '500';
export const CLOUDINARY_IMAGE_CROP = 'scale';
export const IMAGE_LIMIT_SIZE = 10000000; // 10 mb
export const MAX_TIME_OUT = 30000;
export const EXCHANGE_API = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies';
export const EXCHANGE_API_FALLBACK = 'https://latest.currency-api.pages.dev/v1/currencies';
export const BOT_FALLBACK_IMG = 'https://res.cloudinary.com/dbivuiucl/image/upload/v1740018170/kafkaBOT/f20b98957e9d10a82ce1806d31b8e864_worwxa.jpg';

export const HOYOVERSE_UPDATE_COOKIE_API = 'https://webapi-os.account.hoyoverse.com/Api/fetch_cookie_accountinfo';
export const HOYOVERSE_RECORD_CARD_API = 'https://bbs-api-os.hoyolab.com/game_record/card/wapi/getGameRecordCard';
export const HOYOVERSE_GENERAL_HEADERS = {
    Accept: 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br',
    Connection: 'keep-alive',
    'x-rpc-app_version': '2.34.1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'x-rpc-client_type': '4',
    Referer: 'https://act.hoyolab.com/',
    Origin: 'https://act.hoyolab.com',
};

export const HOYOVERSE_GAME_HEADERS: HoyoverseHeader = {
    GENSHIN: {},
    STARRAIL: {},
    ZENLESS: {
        'x-rpc-signgame': 'zzz',
    },
    HONKAI: {},
};

export const HOYOVERSE_REDEMTION_LINKS: HoyoverseRedemptionUrl = {
    GENSHIN: 'https://genshin.hoyoverse.com/en/gift',
    STARRAIL: 'https://hsr.hoyoverse.com/gift',
    ZENLESS: 'https://zenless.hoyoverse.com/redemption',
    HONKAI: '',
};

export const HOYOVERSE_GAME_LIST: HoyoverseGame = {
    GENSHIN: {
        ACT_ID: 'e202102251931481',
        success: 'Congratulations, Traveler! You have successfully checked in today~',
        signed: "Traveler, you've already checked in today~",
        gameName: 'Genshin Impact',
        gameId: 2,
        assets: {
            author: 'Paimon',
            gameName: 'Genshin Impact',
            icon: 'https://fastcdn.hoyoverse.com/static-resource-v2/2024/04/12/b700cce2ac4c68a520b15cafa86a03f0_2812765778371293568.png',
        },
        url: {
            info: 'https://sg-hk4e-api.hoyolab.com/event/sol/info',
            home: 'https://sg-hk4e-api.hoyolab.com/event/sol/home',
            sign: 'https://sg-hk4e-api.hoyolab.com/event/sol/sign',
            redem: 'https://sg-hk4e-api.hoyoverse.com/common/apicdkey/api/webExchangeCdkey',
            checkCodeWeb: ['https://api.ennead.cc/mihoyo/honkai/codes'],
        },
    },

    HONKAI: {
        ACT_ID: 'e202110291205111',
        success: 'You have successfully checked in today, Captain~',
        signed: "You've already checked in today, Captain~",
        gameName: 'Honkai Impact 3rd',
        gameId: 1,
        assets: {
            author: 'Kiana',
            gameName: 'Honkai Impact 3rd',
            icon: 'https://fastcdn.hoyoverse.com/static-resource-v2/2024/02/29/3d96534fd7a35a725f7884e6137346d1_3942255444511793944.png',
        },
        url: {
            info: 'https://sg-public-api.hoyolab.com/event/mani/info',
            home: 'https://sg-public-api.hoyolab.com/event/mani/home',
            sign: 'https://sg-public-api.hoyolab.com/event/mani/sign',
        },
    },

    STARRAIL: {
        ACT_ID: 'e202303301540311',
        success: 'You have successfully checked in today, Trailblazer~',
        signed: "You've already checked in today, Trailblazer~",
        gameName: 'Honkai: Star Rail',
        gameId: 6,
        assets: {
            author: 'PomPom',
            gameName: 'Honkai: Star Rail',
            icon: 'https://fastcdn.hoyoverse.com/static-resource-v2/2024/04/12/74330de1ee71ada37bbba7b72775c9d3_1883015313866544428.png',
        },
        url: {
            info: 'https://sg-public-api.hoyolab.com/event/luna/os/info',
            home: 'https://sg-public-api.hoyolab.com/event/luna/os/home',
            sign: 'https://sg-public-api.hoyolab.com/event/luna/os/sign',
            redem: 'https://sg-hkrpg-api.hoyoverse.com/common/apicdkey/api/webExchangeCdkeyRisk',
            checkCodeWeb: ['https://api.ennead.cc/mihoyo/starrail/codes'],
        },
    },

    ZENLESS: {
        ACT_ID: 'e202406031448091',
        success: 'Congratulations Proxy! You have successfully checked in today!~',
        signed: 'You have already checked in today, Proxy!~',
        gameName: 'Zenless Zone Zero',
        gameId: 8,
        assets: {
            author: 'Eous',
            gameName: 'Zenless Zone Zero',
            icon: 'https://hyl-static-res-prod.hoyolab.com/communityweb/business/nap.png',
        },
        url: {
            info: 'https://sg-act-nap-api.hoyolab.com/event/luna/zzz/os/info',
            home: 'https://sg-act-nap-api.hoyolab.com/event/luna/zzz/os/home',
            sign: 'https://sg-public-api.hoyolab.com/event/luna/zzz/os/sign',
            redem: 'https://public-operation-nap.hoyoverse.com/common/apicdkey/api/webExchangeCdkey',
            checkCodeWeb: ['https://api.ennead.cc/mihoyo/zenless/codes'],
        },
    },
};
