export interface CurrencyResponse {
    [key: string]:
        | {
              [key: string]: number;
          }
        | string;
}
