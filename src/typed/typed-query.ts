import { Class, Unbox } from "../utils";
import { TypedCriteria } from "./typed-criteria";
import { TypedInstance } from "./typed-instance";
import { TypedSelection } from "./typed-selection";

type UnpackUnionClass<T> = T extends any ? Class<T> : never;

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
}

export module TypedQuery {
    export type Construct<T, S> = { criteria?: TypedCriteria<T>; selection: S };
    export type Reduction<T> = TypedQuery<T> | TypedQuery<T>[] | null;
    export type Model<Q extends TypedQuery> = InstanceType<Unbox<Q["model"]>>;

    /**
     * The data a specific query would return (always an array).
     */
    export type Payload<Q extends TypedQuery> = TypedInstance.Selected<Model<Q>, Q["selection"]>[];
}
