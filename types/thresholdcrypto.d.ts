// thresholdcrypto.d.ts
declare module 'thresholdcrypto' {
    export function keyDist(total: number, threshold: number, key: number, modulus: number): Array<[number, number]>;
    export function keyConst(shares: Array<[number, number]>, modulus: number): number;
}