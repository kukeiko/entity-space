import { Class, Unbox } from "../utils";
import { Reducible, Query } from "../query";
// import { TypedCriteria } from "./typed-criteria";
import { TypedInstance } from "./typed-instance";
import { TypedSelection } from "./typed-selection";

type UnpackUnionClass<T> = T extends any ? Class<T> : never;

export abstract class TypedQuery<T = any, S extends TypedSelection<T> = TypedSelection<T>, O extends Reducible = Reducible> implements Query {
    constructor(args: TypedQuery.Construct<T, S, O>) {
        this.criteria = args.criteria ?? [];
        this.selection = args.selection;
        this.options = args.options;
    }

    criteria: any; //TypedCriteria<T>;
    selection: S & TypedSelection<T>;
    options: O;

    // [todo] uncommenting causes error @ ShapeQuery. make sure that using Class<T> instead of UnpackUnionClass<T> is fine.
    // abstract model: UnpackUnionClass<T>[];
    abstract model: Class<T>[];
}

export module TypedQuery {
    // export type Construct<T, S, O> = { criteria?: TypedCriteria<T>; selection: S; options: O };
    export type Construct<T, S, O> = { criteria?: any; selection: S; options: O };
    export type Reduction<T> = TypedQuery<T> | TypedQuery<T>[] | null;
    export type Model<Q extends TypedQuery> = InstanceType<Unbox<Q["model"]>>;

    /**
     * The data a specific query would return (always an array).
     */
    export type Payload<Q extends TypedQuery> = TypedInstance.Selected<Model<Q>, Q["selection"]>[];
}
