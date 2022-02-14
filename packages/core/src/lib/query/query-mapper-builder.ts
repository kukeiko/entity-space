import {
    ICriterionTemplate,
    InstancedCriterionTemplate,
    NamedCriteriaTemplate,
    NamedCriteriaTemplateItems,
} from "@entity-space/criteria";
import { Entity } from "../entity/entity";
import { ExpansionObject } from "../expansion/expansion-object";
import { Query } from "./query";
import { QueryMapper } from "./query-mapper";

type AddFieldsArg<T> = {
    [K in keyof T]?: ICriterionTemplate;
};

export class QueryMapperBuilder<
    T = Record<string, any>,
    R extends NamedCriteriaTemplateItems = {},
    O extends NamedCriteriaTemplateItems = {},
    E = {}
> {
    constructor() {}

    private requiredFields: R = {} as R;
    private optionalFields: O = {} as O;
    private supportedExpansion: E = {} as E;
    private loadEntities?: (query: Query) => Promise<Entity[]>;

    // requiresFields<F extends Partial<Record<keyof T, ICriterionTemplate>>>(
    requiresFields<F extends AddFieldsArg<T>>(fields: F): QueryMapperBuilder<T, R & F, O, E> {
        this.requiredFields = { ...this.requiredFields, ...fields };
        return this as any;
    }

    supportsFields<F extends AddFieldsArg<T>>(fields: F): QueryMapperBuilder<T, R, O & Partial<F>, E> {
        this.optionalFields = { ...this.optionalFields, ...fields };
        return this as any;
    }

    supportsExpansion<X extends ExpansionObject<T>>(expansion: X): QueryMapperBuilder<T, R, O, E & X> {
        // [todo] support merging nested expansions
        this.supportedExpansion = { ...this.supportedExpansion, ...expansion };
        return this as any;
    }

    // [todo] E type not correct; should be deeply partial.
    // either do here or - probably better - when specifying supported expansion.
    isLoadedBy<Q extends Query<T, InstancedCriterionTemplate<NamedCriteriaTemplate<R, O>>, E>>(
        load: (query: Q) => Promise<Entity[]>
    ): this {
        this.loadEntities = load as (query: Query) => Promise<Entity[]>;
        return this;
    }

    build(): QueryMapper<T, R, O, E> {
        if (this.loadEntities === void 0) {
            throw new Error("isLoadedBy() hasn't been called yet");
        }

        return new QueryMapper(this.requiredFields, this.optionalFields, this.supportedExpansion, this.loadEntities);
    }
}
