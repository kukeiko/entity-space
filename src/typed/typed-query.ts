import { Class, Unbox } from "../utils";
import { TypedCriteria } from "./typed-criteria";
import { TypedInstance } from "./typed-instance";
import { TypedSelection } from "./typed-selection";

type UnpackUnionClass<T> = T extends any ? Class<T> : never;

// [todo] move select() & where() out of here: select() causes extreme peformance issues & we should make Queries immutable anyway
export abstract class TypedQuery<T = any, S extends TypedSelection<T> = TypedSelection<T>> {
    constructor(args: TypedQuery.Construct<T, S>) {
        this.criteria = args.criteria ?? [];
        this.selection = args.selection;
    }

    criteria: TypedCriteria<T>;
    selection: S & TypedSelection<T>;

    options = {
        reduce() {
            return null;
        },
    };

    abstract model: UnpackUnionClass<T>[];
    // abstract getModel(): Class<T>;
    abstract getModel(): UnpackUnionClass<T>[];

    // select<O>(select: (selector: ObjectSelector<T>) => ObjectSelector<T, O>): this & { selection: O } {
    //     return this as any;
    // }

    // where(criteria: Criteria<T>): this {
    //     return this;
    // }

    // [todo] implement
    reduce(other: TypedQuery<T>): TypedQuery.Reduction<T> {
        return other;
    }
}

export module TypedQuery {
    export type Construct<T, S> = { criteria?: TypedCriteria<T>; selection: S };
    export type Reduction<T> = TypedQuery<T> | TypedQuery<T>[] | null;
    export type Model<Q extends TypedQuery> = InstanceType<Unbox<ReturnType<Q["getModel"]>>>;
    // [todo] need a way to test performance since we could also do "Q extends TypedQuery<infer U> ? ...Apply<U>" which sounds like it's
    // export type Payload<Q> = Q extends TypedQuery<infer U> ? ObjectSelection.Apply<U, Exclude<Q["selection"], undefined>>[] : never;

    /**
     * The data a specific query would return (always an array).
     */
    export type Payload<Q extends TypedQuery> = TypedInstance.Selected<Model<Q>, Q["selection"]>[];
}
