import { Entity } from "../common/entity.type";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { ICriterion } from "../criteria/criterion.interface";
import { EntityCriteriaShapeTools } from "../criteria/entity-criteria-shape-tools";
import { IEntityCriteriaShapeTools } from "../criteria/entity-criteria-shape-tools.interface";
import { EntityCriteriaTools } from "../criteria/entity-criteria-tools";
import { WhereEntityShapeInstance } from "../criteria/where-entity/where-entity-shape-instance.types";
import { WhereEntityShape } from "../criteria/where-entity/where-entity-shape.types";
import { WhereEntityTools } from "../criteria/where-entity/where-entity-tools";
import { EntitySelection } from "../query/entity-selection";
import { IEntitySchema } from "../schema/schema.interface";
import { EntityApiEndpoint, EntityApiEndpointInvoke } from "./entity-api-endpoint";

export class EntityApiEndpointBuilder<T extends Entity = Entity, S = {}> {
    constructor(schema: IEntitySchema) {
        this.schema = schema;
        this.supportedSelection = schema.getDefaultSelection();
        const criteriaTools = new EntityCriteriaTools();
        this.shapeTools = new EntityCriteriaShapeTools({ criteriaTools });
        this.whereEntityTools = new WhereEntityTools(this.shapeTools, criteriaTools);
    }

    private readonly schema: IEntitySchema;
    private readonly shapeTools: IEntityCriteriaShapeTools;
    private readonly whereEntityTools: WhereEntityTools;
    private whereEntityShape?: WhereEntityShape;
    private supportedSelection: UnpackedEntitySelection;
    private loadEntities?: EntityApiEndpointInvoke;
    private acceptCriterion: (criterion: ICriterion) => boolean = () => true;

    where<S extends WhereEntityShape<T>>(shape: S | WhereEntityShape<T>): EntityApiEndpointBuilder<T, S> {
        this.whereEntityShape = shape;
        return this as any;
    }

    supportsSelection(
        selection: UnpackedEntitySelection<T>
        // selection: PackedEntitySelection<T> // [todo] use this instead
    ): EntityApiEndpointBuilder<T, S> {
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

    isLoadedBy(load: EntityApiEndpointInvoke<T, WhereEntityShapeInstance<T, S>>): this {
        this.loadEntities = load as any;
        return this;
    }

    build(): EntityApiEndpoint {
        if (this.loadEntities === void 0) {
            throw new Error("isLoadedBy() hasn't been called yet");
        }

        const criterionShape =
            this.whereEntityShape === void 0
                ? this.shapeTools.any()
                : this.whereEntityTools.toCriterionShapeFromWhereEntityShape(this.whereEntityShape, this.schema);

        return new EntityApiEndpoint({
            selection: new EntitySelection({ schema: this.schema, value: this.supportedSelection }),
            invoke: this.loadEntities,
            schema: this.schema,
            criterionShape,
            acceptCriterion: this.acceptCriterion,
            whereEntityShape: this.whereEntityShape,
        });
    }
}
