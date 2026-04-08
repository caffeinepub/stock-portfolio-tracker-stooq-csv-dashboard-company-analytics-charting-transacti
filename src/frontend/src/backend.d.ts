import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface HttpRequestResult {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export interface HttpHeader {
    value: string;
    name: string;
}
export interface TransformArgs {
    context: Uint8Array;
    response: HttpRequestResult;
}
export interface backendInterface {
    fetchStockHistory(ticker: string): Promise<string>;
    transform(input: TransformArgs): Promise<HttpRequestResult>;
}
