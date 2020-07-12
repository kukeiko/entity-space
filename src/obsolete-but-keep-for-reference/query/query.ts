import { ObjectCriteria } from "../../criteria";
import { Selection } from "../../selection";
import { Class, Json } from "../../lang";

// export interface Query<T = any> {
export interface Query<T = any, S = Selection<T>> {
    // [todo] think if we need to implement this. i wanted to use it for server side,
    // when we need to make sure to not access a cache that has data that the user has no permissions to see,
    // e.g. a cache from another user.
    // context: QueryContext;

    // [todo] consider rename to "filter", i think that would be more intuitive for most users (i personally still would prefer "criteria")
    // then again, if this is called "filter", we need to think of a new name for "parameters", which can themselves be a kind of filter
    criteria: ObjectCriteria<T>;

    // custom parameters set and interpreted by the user. think of filters with properties that don't exist on
    // the loaded entity.
    // [todo] think about if we wanna open the possibility to use reduce() logic on it,
    // so that when a user has "from" & "to" on it we can help make sure that we're reducing payload sizue
    // parameters?: Json;

    // todo: figure out if "Selection<T>" could be used instead of "S" (so that there is no "S" template var)
    // selection: Selection<T>;
    selection: S;

    // typeId: string;
    entityType: Class<T>;
}
