import { Box, Unbox } from "./lang";
import { Component } from "./component";

export type Instance<T> = Box<Instance.Optional<Unbox<T>> & Instance.Required<Unbox<T>>, T>;

export module Instance {
    type FetchM<T> = T extends Component.Property<any, any, infer M> ? M : never;
    type FetchDtoM<T> = T extends Component.Dto<any, any, infer M> ? M : never;
    type ToArray<T, P> = P extends Component.Array ? T[] : T;

    export type Optional<T> = {
        [K in Component.Property.Keys.Optional<T>]?
        : T[K] extends Component.Navigable.Selected<infer S> | undefined ? ("n" extends FetchM<T[K]> ? Instance<ToArray<S, Exclude<T[K], void>>> | null : Instance<ToArray<S, Exclude<T[K], void>>>)
        : T[K] extends Component.Local.Selected<infer V> | undefined ? "n" extends FetchM<T[K]> ? V | null : V
        : never
    };

    export type Required<T> = {
        [K in Component.Property.Keys.Required<T>]
        : T[K] extends Component.Navigable.Selected<infer S> ? ("n" extends FetchM<T[K]> ? Instance<ToArray<S, T[K]>> | null : Instance<ToArray<S, T[K]>>)
        : T[K] extends Component.Local.Selected<infer V> ? "n" extends FetchM<T[K]> ? V | null : V
        : never
    };

    export type Dto<T> = Box<Dto.Optional<Unbox<T>> & Dto.Required<Unbox<T>>, T>;

    export module Dto {
        export type Optional<T> = {
            [A in Component.Dto.Aliases.Optional<T>]?
            : Component.Dto.WithAlias<T, A> extends Component.Navigable.Selected<infer S> | undefined ? "n" extends FetchDtoM<Component.Dto.WithAlias<T, A>> ? Instance.Dto<ToArray<S, Component.Dto.WithAlias<T, A>>> | null : Instance.Dto<ToArray<S, Component.Dto.WithAlias<T, A>>>
            : Component.Dto.WithAlias<T, A> extends Component.Dto<A, infer D, infer M> | undefined ? "n" extends M ? D | null : D
            : never
        };

        export type Required<T> = {
            [A in Component.Dto.Aliases.Required<T>]
            : Component.Dto.WithAlias<T, A> extends Component.Navigable.Selected<infer S> ? "n" extends FetchDtoM<Component.Dto.WithAlias<T, A>> ? Instance.Dto<ToArray<S, Component.Dto.WithAlias<T, A>>> | null : Instance.Dto<ToArray<S, Component.Dto.WithAlias<T, A>>>
            : Component.Dto.WithAlias<T, A> extends Component.Dto<A, infer D, infer M> ? "n" extends M ? D | null : D
            : never
        };

        // export type Optional<T> = {
        //     [A in Component.Dto.Aliases.Optional<T>]?
        //     : Component.Dto.WithAlias<T, A> extends Component.Expanded<infer E> | undefined ? "n" extends FetchDtoM<Component.Dto.WithAlias<T, A>> ? Instance.Dto<ToArray<E, Component.Dto.WithAlias<T, A>>> | null : Instance.Dto<ToArray<E, Component.Dto.WithAlias<T, A>>>
        //     : Component.Dto.WithAlias<T, A> extends Component.Dto<A, infer D, infer M> | undefined ? "n" extends M ? D | null : D
        //     : never
        // };

        // export type Required<T> = {
        //     [A in Component.Dto.Aliases.Required<T>]
        //     : Component.Dto.WithAlias<T, A> extends Component.Expanded<infer E> ? "n" extends FetchDtoM<Component.Dto.WithAlias<T, A>> ? Instance.Dto<ToArray<E, Component.Dto.WithAlias<T, A>>> | null : Instance.Dto<ToArray<E, Component.Dto.WithAlias<T, A>>>
        //     : Component.Dto.WithAlias<T, A> extends Component.Dto<A, infer D, infer M> ? "n" extends M ? D | null : D
        //     : never
        // };
    }
}
