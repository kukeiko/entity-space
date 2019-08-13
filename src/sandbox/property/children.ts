import { Component } from "../component";
import { Type } from "../type";
import { Instance } from "../instance";
import { Reference } from "./reference";

export type Children<
    K extends string,
    T extends Type<string>,
    P extends Reference.Id.Keys<T>,
    M extends Component.Modifier = never,
    A extends string = K>
    = {
        parentIdKey: P;
    }
    & Component.Array
    & Component.Dto<A, Instance.Dto<Partial<T>[]>, M>
    & Component.Navigable.External<T>
    & Component.Property<K, Instance<Partial<T>[]>, M>;

export module Children { }
