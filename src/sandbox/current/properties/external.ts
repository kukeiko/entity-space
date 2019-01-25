// import { Box, Unbox } from "../lang";
// import { Instance } from "../instance";
import { Navigable } from "./navigable";

export type External<T, V, K extends string, A extends string = K> = Navigable<T, V, K, A> & {
    external: true;
};
