import { Model } from "./model";
import { ObjectCriteria } from "./criteria";
import { Selection } from "./selection";
import { Reducible } from "./reducible";

type ModelCriteria<T> = T extends Model.Object<infer U> ? ObjectCriteria<U> : never;
type ModelSelection<T> = T extends Model.Object<infer U> ? Selection<U> : never;

/**
 * Something that can be executed to load data, where the data is in the form of T.
 * The scope allows us to have different API calls for the same type of data.
 * Each of those API calls can have custom arguments A.
 *
 * The custom arguments A need to be reducible to allow this library to identify if that call is already being made and/or cached.
 */
export interface Query<T extends Model = Model, S extends string = string, A extends Reducible = Reducible> {
    model: T;
    arguments: A;
    scope: S;
    criteria?: ModelCriteria<T>;
    selection?: ModelSelection<T>;
}

export module Query {
    export type ModelObjectInstance<Q> = Q extends Query<infer T> ? (T extends Model.Object<infer U> ? U : never) : never;

    export type Payload<Q extends Query> = Q["model"] extends Model.Object
        ? Selection.Apply<Model.ToValue<Q["model"]>, Exclude<Q["selection"], undefined>>[]
        : Model.ToValue<Q["model"]>[];

    export function is<Q extends Query = Query>(query: any, model?: Q["model"], scope?: Q["scope"]): query is Q {
        // [todo] check model & scope equality
        return {} as any;
    }
}
