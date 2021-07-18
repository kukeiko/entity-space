import { Token } from "../token";

export interface TokenParser<T> {
    accept(token: Token): boolean;
    isComplete(): boolean;
    getResult(): T;
}
