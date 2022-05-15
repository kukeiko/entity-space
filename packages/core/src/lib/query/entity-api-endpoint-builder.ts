import {
    ICriterionTemplate,
    InstancedCriterionTemplate,
    NamedCriteriaTemplate,
    NamedCriteriaTemplateItems,
} from "@entity-space/criteria";
import { DeepPartial } from "@entity-space/utils";
import { Entity } from "../entity/entity";
import { ExpansionObject } from "../expansion/expansion-object";
import { Expansion } from "../public";
import { EntityApiEndpoint } from "./entity-api-endpoint";
import { Query } from "./query";

type AddFieldsArgument<T> = {
    [K in keyof T]?: ICriterionTemplate;
};

export class EntityApiEndpointBuilder<
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

    requiresFields<F extends AddFieldsArgument<T>>(fields: F): EntityApiEndpointBuilder<T, R & F, O, E> {
        this.requiredFields = { ...this.requiredFields, ...fields };
        return this as any;
    }

    supportsFields<F extends AddFieldsArgument<T>>(fields: F): EntityApiEndpointBuilder<T, R, O & Partial<F>, E> {
        this.optionalFields = { ...this.optionalFields, ...fields };
        return this as any;
    }

    supportsExpansion<X extends ExpansionObject<T>>(
        expansion: X
    ): EntityApiEndpointBuilder<T, R, O, E & DeepPartial<X>> {
        this.supportedExpansion = Expansion.mergeObjects(this.supportedExpansion, expansion) as any;
        return this as any;
    }

    isLoadedBy<Q extends Query<T, InstancedCriterionTemplate<NamedCriteriaTemplate<R, O>>, E>>(
        load: (query: Q) => Promise<Entity[]>
    ): this {
        this.loadEntities = load as (query: Query) => Promise<Entity[]>;
        return this;
    }

    build(): EntityApiEndpoint<T, R, O, E> {
        if (this.loadEntities === void 0) {
            throw new Error("isLoadedBy() hasn't been called yet");
        }

        return new EntityApiEndpoint(
            this.requiredFields,
            this.optionalFields,
            this.supportedExpansion,
            this.loadEntities
        );
    }
}
