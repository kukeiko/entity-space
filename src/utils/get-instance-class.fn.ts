import { Class } from "./types";

export function getInstanceClass<T>(instance: T): Class<T> {
    const ctor = (instance as any).constructor;

    if (ctor instanceof Function) {
        return ctor;
    } else {
        throw new Error(`argument ${instance} doesn't look like an instance of a class`);
    }
}
