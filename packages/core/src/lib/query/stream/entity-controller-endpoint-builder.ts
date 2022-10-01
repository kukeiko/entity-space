import { Entity, ExpansionValue } from "@entity-space/common";
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
import { createDefaultExpansion } from "../../entity/functions/create-default-expansion.fn";
import { Expansion } from "../../expansion/expansion";
import { IEntitySchema } from "../../schema/schema.interface";
import { EntityControllerEndpoint, EntityControllerEndpointInvoke } from "./entity-controller-endpoint";

type AddFieldsArgument<T> = {
    [K in keyof T]?: ICriterionTemplate;
};

export class EntityControllerEndpointBuilder<
    T = Entity,
    R extends NamedCriteriaTemplateItems = {},
    O extends NamedCriteriaTemplateItems = {}
> {
    constructor(schema: IEntitySchema) {
        this.schema = schema;
        this.supportedExpansion = createDefaultExpansion(this.schema);
    }

    private readonly schema: IEntitySchema;
    private requiredFields: R = {} as R;
    private optionalFields: O = {} as O;
    private supportedExpansion: ExpansionValue;
    private loadEntities?: EntityControllerEndpointInvoke;
    private acceptCriterion: (criterion: Criterion) => boolean = () => true;

    requiresFields<F extends AddFieldsArgument<T>>(fields: F): EntityControllerEndpointBuilder<T, R & F, O> {
        this.requiredFields = { ...this.requiredFields, ...fields };
        return this as any;
    }

    supportsFields<F extends AddFieldsArgument<T>>(fields: F): EntityControllerEndpointBuilder<T, R, O & Partial<F>> {
        this.optionalFields = { ...this.optionalFields, ...fields };
        return this as any;
    }

    supportsExpansion(expansion: ExpansionValue<T>): EntityControllerEndpointBuilder<T, R, O> {
        this.supportedExpansion = Expansion.mergeValues(this.supportedExpansion, expansion);
        return this;
    }

    acceptsCriterion(accept: (criterion: InstancedCriterionTemplate<NamedCriteriaTemplate<R, O>>) => boolean): this {
        this.acceptCriterion = accept as (criterion: Criterion) => boolean;
        return this;
    }

    isLoadedBy(load: EntityControllerEndpointInvoke<T, NamedCriteriaTemplate<R, O>>): this {
        this.loadEntities = load as any;
        return this;
    }

    build(): EntityControllerEndpoint {
        if (this.loadEntities === void 0) {
            throw new Error("isLoadedBy() hasn't been called yet");
        }

        let template: ICriterionTemplate;

        if (size(this.requiredFields) == 0 && size(this.optionalFields) == 0) {
            template = anyTemplate();
        } else {
            template = namedTemplate(this.requiredFields, this.optionalFields);
        }

        return new EntityControllerEndpoint({
            expansion: new Expansion(this.supportedExpansion),
            invoke: this.loadEntities,
            schema: this.schema,
            template,
            acceptCriterion: this.acceptCriterion,
        });
    }
}
