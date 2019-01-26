import { Navigable } from "./navigable";

export type External<T, V, K extends string, A extends string = K> = {
    external: true;
} & Navigable<T, V, K, A>;
