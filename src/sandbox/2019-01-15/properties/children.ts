import { External } from "./external";
import { Reference } from "./reference";
import { Instance } from "../instance";

export type Children<T, K extends string, P extends Reference.Key.Keys<T>, A extends string = K> = External<T, Instance<T>[], K, A> & {
    parentId: P;
};
