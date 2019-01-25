import { Box, Unbox } from "../lang";
import { Instance } from "../instance";
import { Local } from "./local";
import { Navigable } from "./navigable";

export type Complex<T, K extends string, A extends string = K, V = Box<Instance<Unbox<T>>, T>> = Local<V, K, A, Box<Instance.Dto<Unbox<T>>, T>> & Navigable<T, K, A>;
