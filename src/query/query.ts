import { Class, Unbox } from "../utils";
import { Criteria } from "../entity-criteria";
import { Selection } from "../selection";
import { Instance } from "../instance";

type UnpackUnionClass<T> = T extends any ? Class<T> : never;

// [todo] move select() & where() out of here: select() causes extreme peformance issues & we should make Queries immutable anyway
export abstract class Query<T = any, S extends Selection<T> = Selection<T>> {
    constructor(args: Query.Construct<T, S>) {
        this.criteria = args.criteria ?? [];
        this.selection = args.selection;
    }

    criteria: Criteria<T>;
    selection: S & Selection<T>;

    // abstract getModel(): Class<T>;
    abstract getModel(): UnpackUnionClass<T>[];

    // select<O>(select: (selector: ObjectSelector<T>) => ObjectSelector<T, O>): this & { selection: O } {
    //     return this as any;
    // }

    // where(criteria: ObjectCriteria<T>): this {
    //     return this;
    // }

    // [todo] implement
    reduce(other: Query<T>): Query.Reduction<T> {
        return other;
    }
}

export module Query {
    export type Construct<T, S> = { criteria?: Criteria<T>; selection: S };
    export type Reduction<T> = Query<T> | Query<T>[] | null;
    export type Model<Q extends Query> = InstanceType<Unbox<ReturnType<Q["getModel"]>>>;
    // [todo] need a way to test performance since we could also do "Q extends Query<infer U> ? ...Apply<U>" which sounds like it's
    // export type Payload<Q> = Q extends Query<infer U> ? ObjectSelection.Apply<U, Exclude<Q["selection"], undefined>>[] : never;

    /**
     * The data a specific query would return (always an array).
     */
    export type Payload<Q extends Query> = Instance.Selected<Model<Q>, Q["selection"]>[];
}
