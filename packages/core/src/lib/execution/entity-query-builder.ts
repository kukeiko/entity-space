import { getInstanceClass, pluckId } from "@entity-space/utils";
import { map, Observable } from "rxjs";
import { Entity } from "../common/entity.type";
import { PackedEntitySelection } from "../common/packed-entity-selection.type";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { ICriterion } from "../criteria/vnext/criterion.interface";
import { EntityCriteriaFactory } from "../criteria/vnext/entity-criteria-factory";
import { EntityWhere } from "../criteria/vnext/entity-criteria-factory.interface";
import { EntitySelection } from "../query/entity-selection";
import { IEntitySchema } from "../schema/schema.interface";
import { EntityWorkspace } from "./entity-workspace";

export interface EntityQueryBuilderPatch<T extends Entity> {
    selection?: UnpackedEntitySelection<T>;
    criteria?: ICriterion;
}

export interface EntityQueryBuilderArgument<T extends Entity> extends EntityQueryBuilderPatch<T> {
    schema: IEntitySchema<T>;
    workspace: EntityWorkspace;
}

const factory = new EntityCriteriaFactory();

class WhereHelper {
    inIds<T extends { id: any }>(items: T[]): T["id"][] {
        return pluckId(items);
    }

    some = factory.some;
    where = factory.where;
}

export class EntityQueryBuilder<T extends Entity = Entity> {
    constructor(args: EntityQueryBuilderArgument<T>) {
        this.copyArgs = args;
        this.schema = args.schema;
        this.selection = args.selection ?? args.schema.getDefaultSelection();
        this.workspace = args.workspace;
        this.criteria = args.criteria ?? new EntityCriteriaFactory().all();
    }

    private readonly copyArgs: EntityQueryBuilderArgument<T>;
    private readonly schema: IEntitySchema<T>;
    private readonly workspace: EntityWorkspace;
    private readonly selection: UnpackedEntitySelection<T>;
    private readonly criteria: ICriterion;

    copy(patch?: EntityQueryBuilderPatch<T>): this {
        return new (getInstanceClass(this))({ ...this.copyArgs, ...(patch ?? {}) });
    }

    select(selection: PackedEntitySelection<T>): this {
        const unpacked = EntitySelection.unpack(this.schema, selection);
        const merged = EntitySelection.mergeValues(this.selection, unpacked);

        return this.copy({ selection: merged });
    }

    // [todo] currently replaces any previously set criteria, should instead allow combining them with and/or
    where(criteria: EntityWhere<T> | ((helper: WhereHelper) => EntityWhere<T>)): this {
        if (typeof criteria === "function") {
            return this.copy({ criteria: new EntityCriteriaFactory().where(criteria(new WhereHelper())) });
        } else {
            return this.copy({ criteria: new EntityCriteriaFactory().where(criteria) });
        }
    }

    findAll(): Observable<{ entities: T[] }> {
        return this.workspace.query$(this.schema, this.criteria, this.selection).pipe(map(entities => ({ entities })));
    }

    findOne(): Observable<{ entity: T | undefined }> {
        return this.workspace
            .query$(this.schema, this.criteria, this.selection)
            .pipe(map(entities => ({ entity: entities[0] })));
    }
}
