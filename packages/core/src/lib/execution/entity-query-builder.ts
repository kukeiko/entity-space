import { getInstanceClass, pluckId } from "@entity-space/utils";
import { map, Observable } from "rxjs";
import { Entity } from "../common/entity.type";
import { PackedEntitySelection } from "../common/packed-entity-selection.type";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { ICriterion } from "../criteria/criterion.interface";
import { EntityCriteriaTools } from "../criteria/entity-criteria-tools";
import { EntityCriteriaShapeTools } from "../criteria/entity-criteria-shape-tools";
import { WhereEntityTools } from "../criteria/where-entity/where-entity-tools";
import { WhereEntitySingle } from "../criteria/where-entity/where-entity.types";
import { EntitySelection } from "../query/entity-selection";
import { IEntitySchema } from "../schema/schema.interface";
import { EntityWorkspace } from "./entity-workspace";

export interface EntityQueryBuilderPatch<T extends Entity> {
    selection?: UnpackedEntitySelection<T>;
    criteria?: ICriterion;
    parameters?: Entity;
}

export interface EntityQueryBuilderCreate<T extends Entity> extends EntityQueryBuilderPatch<T> {
    schema: IEntitySchema<T>;
    workspace: EntityWorkspace;
}

export class EntityQueryBuilder<T extends Entity = Entity> {
    constructor(args: EntityQueryBuilderCreate<T>) {
        this.createArgs = args;
        this.schema = args.schema;
        this.selection = args.selection ?? args.schema.getDefaultSelection();
        this.workspace = args.workspace;
        this.criteria = args.criteria ?? new EntityCriteriaTools().all();
        this.parameters = args.parameters;
        this.criteriaTools = new EntityCriteriaTools();
        this.shapeTools = new EntityCriteriaShapeTools({ criteriaTools: this.criteriaTools });
        this.whereEntityTools = new WhereEntityTools(this.shapeTools, this.criteriaTools);
    }

    private readonly createArgs: EntityQueryBuilderCreate<T>;
    private readonly schema: IEntitySchema<T>;
    private readonly workspace: EntityWorkspace;
    private readonly selection: UnpackedEntitySelection<T>;
    private readonly criteria: ICriterion;
    private readonly parameters?: Entity;
    private readonly criteriaTools: EntityCriteriaTools;
    private readonly shapeTools: EntityCriteriaShapeTools;
    private readonly whereEntityTools: WhereEntityTools;

    copy(patch?: EntityQueryBuilderPatch<T>): this {
        return new (getInstanceClass(this))({ ...this.createArgs, ...(patch ?? {}) });
    }

    select(selection: PackedEntitySelection<T>): this {
        const unpacked = EntitySelection.unpack(this.schema, selection);
        const merged = EntitySelection.mergeValues(this.selection, unpacked);

        return this.copy({ selection: merged });
    }

    // [todo] currently replaces any previously set criteria, should instead allow combining them with and/or
    where(criteria: WhereEntitySingle<T>): this {
        const criterion = this.whereEntityTools.toCriterionFromWhereEntitySingle(this.schema, criteria);
        const simplified = criterion.simplify();

        return this.copy({ criteria: simplified });
    }

    using(parameters: Entity): this {
        return this.copy({ parameters });
    }

    findAll(): Observable<{ entities: T[] }> {
        return this.workspace
            .query$(this.schema, this.criteria, this.selection, this.parameters)
            .pipe(map(entities => ({ entities })));
    }

    findOne(): Observable<{ entity: T | undefined }> {
        return this.workspace
            .query$(this.schema, this.criteria, this.selection, this.parameters)
            .pipe(map(entities => ({ entity: entities[0] })));
    }
}
