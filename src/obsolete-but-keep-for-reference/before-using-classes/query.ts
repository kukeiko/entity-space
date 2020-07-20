import { Model } from "../model";
import { ObjectCriteria } from "../../criteria";
import { Selection } from "../selection";
import { Reducible } from "./reducible";

type Foo<T> = T extends Model.Object<infer U> ? Selection<U> : never;

/**
 * Something that can be executed to load data, where the data is in the form of T.
 * The scope allows us to have different API calls for the same type of data.
 * Each of those API calls can have custom arguments A.
 *
 * The custom arguments A need to be reducible to allow this library to identify if that call is already being made and/or cached.
 */
export interface Query<T extends Model = Model, S extends string = string, A extends Reducible = Reducible> {
    /**
     * The type of data you want to load.
     */
    model: T;
    /**
     * The scope within which this query will be executed. Usually refers to an API call.
     */
    scope: S;
    /**
     * The arguments for the scope S.
     */
    arguments: A;
    /**
     * Generic filtering criteria based on the properties of T, if T represents an object. Otherwise (e.g. T is of type number) will be "never".
     */
    criteria?: T extends Model.Object<infer U> ? ObjectCriteria<U> : never;
    /**
     * Selection of optional properties to include. Only exists if T represents an object.
     */
    selection?: T extends Model.Object<infer U> ? Selection<U> : never;
}

export module Query {
    /**
     * A small helper type to unwrap the type that would be instantiated in case query Q has a model T that represents an object.
     */
    export type ModelObjectInstance<Q> = Q extends Query<infer T> ? (T extends Model.Object<infer U> ? U : never) : never;

    /**
     * The type of value the query Q returns when executed.
     */
    export type Payload<Q extends Query> = Q["model"] extends Model.Object // [todo] this commented out line causes Type instantiation is excessively deep and possibly infinite.ts(2589) @ workspace
        ? Selection.Apply<Model.ToValue<Q["model"]>, Exclude<Q["selection"], undefined>>[]
        : Model.ToValue<Q["model"]>[];

    /**
     * Type guard to determine if something is a query. Optionally narrow down by model T and scope S.
     * You are expected to provide the generic Q manually to narrow down to a specific query of yours, e.g. "Query.is\<MyCustomQuery\>(query, ...)"
     *
     * @param query the thing to check if it is a query.
     * @param model the model the query must have
     * @param scope the scope the query must have
     */
    export function is<Q extends Query = Query>(query: any, model?: Q["model"], scope?: Q["scope"]): query is Q {
        // [todo] check model & scope equality
        return {} as any;
    }
}
