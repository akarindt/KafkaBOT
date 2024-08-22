import {v2 as cloudinary} from 'cloudinary';

export default class CloudinaryClient {
    private _uploader: typeof cloudinary.uploader;

    constructor() {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API,
            api_secret: process.env.CLOUDINARY_SECRET,
        })

        this._uploader = cloudinary.uploader;
    }

    public get uploader() {
        return this._uploader
    }

}