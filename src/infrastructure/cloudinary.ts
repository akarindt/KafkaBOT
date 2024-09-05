import { v2 as cloudinary } from 'cloudinary';

export default class CloudinaryClient {
    private _analysis: typeof cloudinary.analysis;
    private _api: typeof cloudinary.api;
    private _cloudinaryJSConfig: typeof cloudinary.cloudinary_js_config;
    private _config: typeof cloudinary.config;
    private _image: typeof cloudinary.image;
    private _picture: typeof cloudinary.picture;
    private _provisioning: typeof cloudinary.provisioning;
    private _search: typeof cloudinary.search;
    private _source: typeof cloudinary.source;
    private _uploader: typeof cloudinary.uploader;
    private _url: typeof cloudinary.url;
    private _utils: typeof cloudinary.utils;
    private _video: typeof cloudinary.video;

    constructor() {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API,
            api_secret: process.env.CLOUDINARY_SECRET,
        });

        this._analysis = cloudinary.analysis;
        this._api = cloudinary.api;
        this._cloudinaryJSConfig = cloudinary.cloudinary_js_config;
        this._config = cloudinary.config;
        this._image = cloudinary.image;
        this._picture = cloudinary.picture;
        this._provisioning = cloudinary.provisioning;
        this._search = cloudinary.search;
        this._source = cloudinary.source;
        this._uploader = cloudinary.uploader;
        this._url = cloudinary.url;
        this._utils = cloudinary.utils;
        this._video = cloudinary.video;
    }

    public get analysis() {
        return this._analysis;
    }

    public get api() {
        return this._api;
    }

    public get cloudinaryJSConfig() {
        return this._cloudinaryJSConfig;
    }

    public get config() {
        return this._config;
    }

    public get image() {
        return this._image;
    }

    public get picture() {
        return this._picture;
    }

    public get provisioning() {
        return this._provisioning;
    }

    public get search() {
        return this._search;
    }

    public get source() {
        return this._source;
    }

    public get uploader() {
        return this._uploader;
    }

    public get url() {
        return this._url;
    }

    public get utils() {
        return this._utils;
    }

    public get video() {
        return this._video;
    }
}
