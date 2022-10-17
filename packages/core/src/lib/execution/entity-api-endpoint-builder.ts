import { Entity, ExpansionValue, IEntitySchema } from "@entity-space/common";
import {
    anyTemplate,
    Criterion,
    ICriterionTemplate,
    InstancedCriterionTemplate,
    NamedCriteriaTemplate,
    NamedCriteriaTemplateItems,
    namedTemplate,
    neverTemplate,
} from "@entity-space/criteria";
import { size } from "lodash";
import { Expansion } from "../expansion/expansion";
import { EntityApiEndpoint, EntityApiEndpointInvoke } from "./entity-api-endpoint";

type AddFieldsArgument<T> = {
    [K in keyof T]?: ICriterionTemplate;
};

export class EntityApiEndpointBuilder<
    T extends Entity = Entity,
    CriterionRequiredFields extends NamedCriteriaTemplateItems = {},
    CriterionOptionalFields extends NamedCriteriaTemplateItems = {},
    OptionsRequiredFields extends NamedCriteriaTemplateItems = {},
    OptionsOptionalFields extends NamedCriteriaTemplateItems = {}
> {
    constructor(schema: IEntitySchema) {
        this.schema = schema;
        this.supportedExpansion = schema.getDefaultExpansion();
    }

    private readonly schema: IEntitySchema;
    private anyCriteriaSupported = false;
    private requiredFields: CriterionRequiredFields = {} as CriterionRequiredFields;
    private optionalFields: CriterionOptionalFields = {} as CriterionOptionalFields;
    private anyOptionsSupported = false;
    private requiredOptionFields: OptionsRequiredFields = {} as OptionsRequiredFields;
    private optionalOptionFields: OptionsOptionalFields = {} as OptionsOptionalFields;
    private pagingRequired = false;
    private pagingSupported = false;

    private supportedExpansion: ExpansionValue;
    private loadEntities?: EntityApiEndpointInvoke;
    private acceptCriterion: (criterion: Criterion) => boolean = () => true;

    supportsAnyOptions(): this {
        this.anyOptionsSupported = true;
        return this;
    }

    requiresOptions<F extends AddFieldsArgument<Entity>>(
        fields: F
    ): EntityApiEndpointBuilder<
        T,
        CriterionRequiredFields,
        CriterionOptionalFields,
        OptionsRequiredFields & F,
        OptionsOptionalFields
    > {
        this.requiredOptionFields = { ...this.requiredOptionFields, ...fields };
        return this as any;
    }

    supportsOptions<F extends AddFieldsArgument<Entity>>(
        fields: F
    ): EntityApiEndpointBuilder<
        T,
        CriterionRequiredFields,
        CriterionOptionalFields,
        OptionsRequiredFields,
        OptionsOptionalFields & Partial<F>
    > {
        this.optionalOptionFields = { ...this.optionalOptionFields, ...fields };
        return this as any;
    }

    requiresPaging(): this {
        this.pagingRequired = true;
        return this;
    }

    supportsPaging(): this {
        this.pagingSupported = true;
        return this;
    }

    supportsAnyFields(): this {
        this.anyCriteriaSupported = true;
        return this;
    }

    requiresFields<F extends AddFieldsArgument<T>>(
        fields: F
    ): EntityApiEndpointBuilder<
        T,
        CriterionRequiredFields & F,
        CriterionOptionalFields,
        OptionsRequiredFields,
        OptionsOptionalFields
    > {
        this.requiredFields = { ...this.requiredFields, ...fields };
        return this as any;
    }

    supportsFields<F extends AddFieldsArgument<T>>(
        fields: F
    ): EntityApiEndpointBuilder<
        T,
        CriterionRequiredFields,
        CriterionOptionalFields & Partial<F>,
        OptionsRequiredFields,
        OptionsOptionalFields
    > {
        this.optionalFields = { ...this.optionalFields, ...fields };
        return this as any;
    }

    supportsExpansion(
        expansion: ExpansionValue<T>
    ): EntityApiEndpointBuilder<
        T,
        CriterionRequiredFields,
        CriterionOptionalFields,
        OptionsRequiredFields,
        OptionsOptionalFields
    > {
        this.supportedExpansion = Expansion.mergeValues(this.schema, this.supportedExpansion, expansion);
        return this;
    }

    acceptsCriterion(
        accept: (
            criterion: InstancedCriterionTemplate<
                NamedCriteriaTemplate<CriterionRequiredFields, CriterionOptionalFields>
            >
        ) => boolean
    ): this {
        this.acceptCriterion = accept as (criterion: Criterion) => boolean;
        return this;
    }

    isLoadedBy(
        load: EntityApiEndpointInvoke<
            T,
            NamedCriteriaTemplate<CriterionRequiredFields, CriterionOptionalFields>,
            NamedCriteriaTemplate<OptionsRequiredFields, OptionsOptionalFields>
        >
    ): this {
        this.loadEntities = load as any;
        return this;
    }

    build(): EntityApiEndpoint {
        if (this.loadEntities === void 0) {
            throw new Error("isLoadedBy() hasn't been called yet");
        }

        let optionsTemplate: ICriterionTemplate;

        if (this.anyOptionsSupported) {
            optionsTemplate = anyTemplate();
        } else if (size(this.requiredOptionFields) || (0 && size(this.optionalOptionFields) > 0)) {
            optionsTemplate = namedTemplate(this.requiredOptionFields, this.optionalOptionFields);
        } else {
            optionsTemplate = neverTemplate();
        }

        let criterionTemplate: ICriterionTemplate;

        if (size(this.requiredFields) > 0 || size(this.optionalFields) > 0) {
            criterionTemplate = namedTemplate(this.requiredFields, this.optionalFields);
        } else {
            criterionTemplate = anyTemplate();
        }

        return new EntityApiEndpoint({
            expansion: new Expansion({ schema: this.schema, value: this.supportedExpansion }),
            invoke: this.loadEntities,
            schema: this.schema,
            criterionTemplate,
            optionsTemplate,
            acceptCriterion: this.acceptCriterion,
            pagingRequired: this.pagingRequired,
            pagingSupported: this.pagingSupported,
        });
    }
}
