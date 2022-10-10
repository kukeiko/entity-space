import { Entity, ExpansionValue, IEntitySchema } from "@entity-space/common";
import {
    anyTemplate,
    Criterion,
    ICriterionTemplate,
    InstancedCriterionTemplate,
    NamedCriteriaTemplate,
    NamedCriteriaTemplateItems,
    namedTemplate,
} from "@entity-space/criteria";
import { size } from "lodash";
import { Expansion } from "../expansion/expansion";
import { EntityApiEndpoint, EntityApiEndpointInvoke } from "./entity-api-endpoint";

type AddFieldsArgument<T> = {
    [K in keyof T]?: ICriterionTemplate;
};

export class EntityApiEndpointBuilder<
    T = Entity,
    R extends NamedCriteriaTemplateItems = {},
    O extends NamedCriteriaTemplateItems = {}
> {
    constructor(schema: IEntitySchema) {
        this.schema = schema;
        this.supportedExpansion = schema.getDefaultExpansion();
    }

    private readonly schema: IEntitySchema;
    private requiredFields: R = {} as R;
    private optionalFields: O = {} as O;
    private supportedExpansion: ExpansionValue;
    private loadEntities?: EntityApiEndpointInvoke;
    private acceptCriterion: (criterion: Criterion) => boolean = () => true;

    requiresFields<F extends AddFieldsArgument<T>>(fields: F): EntityApiEndpointBuilder<T, R & F, O> {
        this.requiredFields = { ...this.requiredFields, ...fields };
        return this as any;
    }

    supportsFields<F extends AddFieldsArgument<T>>(fields: F): EntityApiEndpointBuilder<T, R, O & Partial<F>> {
        this.optionalFields = { ...this.optionalFields, ...fields };
        return this as any;
    }

    supportsExpansion(expansion: ExpansionValue<T>): EntityApiEndpointBuilder<T, R, O> {
        this.supportedExpansion = Expansion.mergeValues(this.schema, this.supportedExpansion, expansion);
        return this;
    }

    acceptsCriterion(accept: (criterion: InstancedCriterionTemplate<NamedCriteriaTemplate<R, O>>) => boolean): this {
        this.acceptCriterion = accept as (criterion: Criterion) => boolean;
        return this;
    }

    isLoadedBy(load: EntityApiEndpointInvoke<T, NamedCriteriaTemplate<R, O>>): this {
        this.loadEntities = load as any;
        return this;
    }

    build(): EntityApiEndpoint {
        if (this.loadEntities === void 0) {
            throw new Error("isLoadedBy() hasn't been called yet");
        }

        let template: ICriterionTemplate;

        if (size(this.requiredFields) == 0 && size(this.optionalFields) == 0) {
            template = anyTemplate();
        } else {
            template = namedTemplate(this.requiredFields, this.optionalFields);
        }

        return new EntityApiEndpoint({
            expansion: new Expansion({ schema: this.schema, value: this.supportedExpansion }),
            invoke: this.loadEntities,
            schema: this.schema,
            template,
            acceptCriterion: this.acceptCriterion,
        });
    }
}
