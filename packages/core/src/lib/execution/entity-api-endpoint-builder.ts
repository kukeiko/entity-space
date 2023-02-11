import { size } from "lodash";
import { Entity } from "../common/entity.type";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { InstancedCriterionShape } from "../criteria/templates/instanced-criterion-shape.type";
import { NamedCriteriaShape, NamedCriteriaShapeItems } from "../criteria/templates/named-criteria-shape";
import { ICriterionShape } from "../criteria/vnext/criterion-shape.interface";
import { ICriterion } from "../criteria/vnext/criterion.interface";
import { EntityCriteriaFactory } from "../criteria/vnext/entity-criteria-factory";
import { EntityCriteriaShapeFactory } from "../criteria/vnext/entity-criteria-shape-factory";
import { $optional, $required } from "../criteria/vnext/entity-criteria/entity-criteria-shape";
import { EntitySelection } from "../query/entity-selection";
import { IEntitySchema } from "../schema/schema.interface";
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
    private requiredFields: Record<string, ICriterionShape> = {} as Record<string, ICriterionShape>;
    private optionalFields: Record<string, ICriterionShape> = {} as Record<string, ICriterionShape>;
    private anyOptionsSupported = false;
    private requiredOptionFields: OptionsRequiredFields = {} as OptionsRequiredFields;
    private optionalOptionFields: OptionsOptionalFields = {} as OptionsOptionalFields;
    private pagingRequired = false;
    private pagingSupported = false;

    private supportedSelection: UnpackedEntitySelection;
    private loadEntities?: EntityApiEndpointInvoke;
    private acceptCriterion: (criterion: ICriterion) => boolean = () => true;

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
            // [todo] fix
            criterion: any // InstancedCriterionShape<NamedCriteriaShape<CriterionRequiredFields, CriterionOptionalFields>>
        ) => boolean
    ): this {
        this.acceptCriterion = accept as (criterion: ICriterion) => boolean;
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

        const criteriaFactory = new EntityCriteriaFactory();
        const factory = new EntityCriteriaShapeFactory({ criteriaFactory });

        let optionsTemplate: ICriterionShape;

        if (this.anyOptionsSupported) {
            optionsTemplate = factory.any();
        } else if (size(this.requiredOptionFields) || (0 && size(this.optionalOptionFields) > 0)) {
            optionsTemplate = factory.where({
                [$required]: this.requiredOptionFields,
                [$optional]: this.optionalOptionFields,
            });
        } else {
            optionsTemplate = factory.never();
        }

        let criterionTemplate: ICriterionShape;

        if (size(this.requiredFields) > 0 || size(this.optionalFields) > 0) {
            criterionTemplate = factory.where({ [$required]: this.requiredFields, [$optional]: this.optionalFields });
        } else {
            criterionTemplate = factory.any();
        }

        return new EntityApiEndpoint({
            selection: new EntitySelection({ schema: this.schema, value: this.supportedSelection }),
            invoke: this.loadEntities,
            schema: this.schema,
            criterionTemplate,
            optionsTemplate: optionsTemplate,
            acceptCriterion: this.acceptCriterion,
            pagingRequired: this.pagingRequired,
            pagingSupported: this.pagingSupported,
        });
    }
}
