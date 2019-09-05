import { Type } from "../type";

export class Domain<T = {}> {
    constructor() {
    }

    getType<K extends keyof T>(key: K): T[K] {
        return null as any;
    }
}
