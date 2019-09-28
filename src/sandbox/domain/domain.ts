import { Type } from "../type";

export class Domain<T = {}> {
    private _types: T;

    constructor(types: T) {
        this._types = types;
    }

    getType<K extends keyof T>(key: K): T[K] {
        return this._types[key];
    }
}
