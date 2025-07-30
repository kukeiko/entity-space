import { isObservable, lastValueFrom } from "rxjs";
import { MaybeAsync } from "./types";

export function unwrapMaybeAsync<T>(value: MaybeAsync<T>): Promise<T> {
    if (value instanceof Promise) {
        return value;
    } else if (isObservable(value)) {
        return lastValueFrom(value);
    } else {
        return Promise.resolve(value);
    }
}
