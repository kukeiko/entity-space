import { Selection } from "../selection";
import { Query } from "./query";
import { Selector } from "../selector";
import { ObjectCriteria } from "../../criteria";

const Selected = Symbol();

export interface QueryBuilder<Q extends Query> {
    [Selected]: Selection<Query.ModelObjectInstance<Q>>;
    arguments(): this;
    select<O>(select: (selector: Selector<Query.ModelObjectInstance<Q>>) => Selector<Query.ModelObjectInstance<Q>, O>): this & { [Selected]: O };
    where(criteria: ObjectCriteria<Query.ModelObjectInstance<Q>>): this;
    build(): Q & Record<"selection", this[typeof Selected]>;
}
