import { Navigable } from "./navigable";

export type External<T, K extends string, A extends string = K> = {
    external: true;
} & Navigable<T, K, A>;
