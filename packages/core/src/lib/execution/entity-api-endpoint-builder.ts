import { Entity, IEntitySchema, UnpackedEntitySelection } from "@entity-space/common";
import {
    anyShape,
    Criterion,
    ICriterionShape,
    InstancedCriterionShape,
    NamedCriteriaShape,
    NamedCriteriaShapeItems,
    namedShape,
    neverShape,
} from "@entity-space/criteria";
import { size } from "lodash";
import { EntitySelection } from "../query/entity-selection";
import { EntityApiEndpoint, EntityApiEndpointInvoke } from "./entity-api-endpoint";

type AddFieldsArgument<T> = {
    [K in keyof T]?: ICriterionShape;
};

export class EntityApiEndpointBuilder<
    T extends Entity = Entity,
    CriterionRequiredFields extends NamedCriteriaShapeItems = {},
    CriterionOptionalFields extends NamedCriteriaShapeItems = {},
    OptionsRequiredFields extends NamedCriteriaShapeItems = {},
    OptionsOptionalFields extends NamedCriteriaShapeItems = {}
> {
    constructor(schema: IEntitySchema) {
        this.schema = schema;
        this.supportedSelection = schema.getDefaultSelection();
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

    private supportedSelection: UnpackedEntitySelection;
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

    supportsSelection(
        selection: UnpackedEntitySelection<T>
        // selection: PackedEntitySelection<T> // [todo] use this instead
    ): EntityApiEndpointBuilder<
        T,
        CriterionRequiredFields,
        CriterionOptionalFields,
        OptionsRequiredFields,
        OptionsOptionalFields
    > {
        this.supportedSelection = EntitySelection.mergeValues(this.supportedSelection, selection);
        return this;
    }

    acceptsCriterion(
        accept: (
            criterion: InstancedCriterionShape<NamedCriteriaShape<CriterionRequiredFields, CriterionOptionalFields>>
        ) => boolean
    ): this {
        this.acceptCriterion = accept as (criterion: Criterion) => boolean;
        return this;
    }

    isLoadedBy(
        load: EntityApiEndpointInvoke<
            T,
            NamedCriteriaShape<CriterionRequiredFields, CriterionOptionalFields>,
            NamedCriteriaShape<OptionsRequiredFields, OptionsOptionalFields>
        >
    ): this {
        this.loadEntities = load as any;
        return this;
    }

    build(): EntityApiEndpoint {
        if (this.loadEntities === void 0) {
            throw new Error("isLoadedBy() hasn't been called yet");
        }

        let optionsTemplate: ICriterionShape;

        if (this.anyOptionsSupported) {
            optionsTemplate = anyShape();
        } else if (size(this.requiredOptionFields) || (0 && size(this.optionalOptionFields) > 0)) {
            optionsTemplate = namedShape(this.requiredOptionFields, this.optionalOptionFields);
        } else {
            optionsTemplate = neverShape();
        }

        let criterionTemplate: ICriterionShape;

        if (size(this.requiredFields) > 0 || size(this.optionalFields) > 0) {
            criterionTemplate = namedShape(this.requiredFields, this.optionalFields);
        } else {
            criterionTemplate = anyShape();
        }

        return new EntityApiEndpoint({
            selection: new EntitySelection({ schema: this.schema, value: this.supportedSelection }),
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
