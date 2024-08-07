import { DatabaseConfig } from '@/helper/constant';
import { DataSource, DataSourceOptions } from 'typeorm';

export class Database {
    private _options: DataSourceOptions;
    private _Source: DataSource;

    constructor(options: DataSourceOptions) {
        this._options = options;
        this._Source = new DataSource(this._options);
    }

    public get options() {
        return this._options;
    }

    public get Source() {
        return this._Source;
    }

    public InitializeDB() {
        this._Source
            .initialize()
            .then(() => {
                console.log(`[INFO] Database connected - current driver: ${DatabaseConfig.DEFAULT_DB.type}`);
            })
            .catch((error) => console.log(error));
    }
}
