import { isObservable, lastValueFrom } from "rxjs";
import { SyncOrAsyncValue } from "./types";

export function unwrapSyncOrAsyncValue<T>(value: SyncOrAsyncValue<T>): Promise<T> {
    if (value instanceof Promise) {
        return value;
    } else if (isObservable(value)) {
        return lastValueFrom(value);
    } else {
        return Promise.resolve(value);
    }
}
