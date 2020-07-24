// credits to hediet @ https://github.com/microsoft/TypeScript/issues/15628#issuecomment-472817194
export type MergeUnion<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
