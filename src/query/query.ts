import { Class } from "../utils";
import { ObjectCriteria } from "../criteria";
import { ObjectSelection } from "../selection";

// [todo] move select() & where() out of here: select() causes extreme peformance issues & we should make Queries immutable anyway
export abstract class Query<T = any, S extends ObjectSelection<T> = {}> {
    constructor(args: Query.Construct<T, S>) {
        this.criteria = args.criteria ?? [];
        this.selection = args.selection;
    }

    criteria: ObjectCriteria<T>;
    selection: S;

    abstract getModel(): Class<T>;

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
    export type Construct<T, S> = { criteria?: ObjectCriteria<T>; selection: S };
    export type Reduction<T> = Query<T> | Query<T>[] | null;
    export type Model<Q extends Query> = InstanceType<ReturnType<Q["getModel"]>>;
    // [todo] need a way to test performance since we could also do "Q extends Query<infer U> ? ...Apply<U>" which sounds like it's
    // export type Payload<Q> = Q extends Query<infer U> ? ObjectSelection.Apply<U, Exclude<Q["selection"], undefined>>[] : never;
    export type Payload<Q extends Query> = ObjectSelection.Apply<Model<Q>, Exclude<Q["selection"], undefined>>[];
    export type Selection<T> = ObjectSelection<T>;
}
