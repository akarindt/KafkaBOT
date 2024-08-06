import { DataSource, DataSourceOptions } from "typeorm";

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
        console.log("DATABASE CONNECTED");
      })
      .catch((error) => console.log(error));
  }
}
