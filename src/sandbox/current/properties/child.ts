import { Unbox } from "../lang";
import { External } from "./external";
import { Reference } from "./reference";
import { Instance } from "../instance";

export type Child<T, K extends string, P extends Reference.Keys<U> & keyof U, A extends string = K, U = Unbox<T>> = {
    parentReference: U[P];
} & External<U, T extends any[] ? Instance<U>[] : T | null, K, A>;
