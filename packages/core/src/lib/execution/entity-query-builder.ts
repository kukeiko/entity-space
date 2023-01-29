import { IEntitySchema, PackedEntitySelection, UnpackedEntitySelection } from "@entity-space/common";
import { any, Criterion, matches, MatchesBagArgument, some } from "@entity-space/criteria";
import { getInstanceClass, pluckId } from "@entity-space/utils";
import { map, Observable } from "rxjs";
import { Entity } from "../entity/entity";
import { EntityWorkspace } from "./entity-workspace";
import { EntitySelection } from "../query/entity-selection";

export interface EntityQueryBuilderPatch<T extends Entity> {
    selection?: UnpackedEntitySelection<T>;
    criteria?: Criterion;
}

export interface EntityQueryBuilderArgument<T extends Entity> extends EntityQueryBuilderPatch<T> {
    schema: IEntitySchema<T>;
    workspace: EntityWorkspace;
}

class WhereHelper {
    inIds<T extends { id: any }>(items: T[]): T["id"][] {
        return pluckId(items);
    }

    some = some;
    where = matches;
}

export class EntityQueryBuilder<T extends Entity = Entity> {
    constructor(args: EntityQueryBuilderArgument<T>) {
        this.copyArgs = args;
        this.schema = args.schema;
        this.selection = args.selection ?? args.schema.getDefaultSelection();
        this.workspace = args.workspace;
        this.criteria = args.criteria ?? any();
    }

    private readonly copyArgs: EntityQueryBuilderArgument<T>;
    private readonly schema: IEntitySchema<T>;
    private readonly workspace: EntityWorkspace;
    private readonly selection: UnpackedEntitySelection<T>;
    private readonly criteria: Criterion;

    copy(patch?: EntityQueryBuilderPatch<T>): this {
        return new (getInstanceClass(this))({ ...this.copyArgs, ...(patch ?? {}) });
    }

    select(selection: PackedEntitySelection<T>): this {
        const unpacked = EntitySelection.unpack(this.schema, selection);
        const merged = EntitySelection.mergeValues(this.selection, unpacked);

        return this.copy({ selection: merged });
    }

    // [todo] currently replaces any previously set criteria, should instead allow combining them with and/or
    where(criteria: MatchesBagArgument<T> | ((helper: WhereHelper) => MatchesBagArgument<T>)): this {
        if (typeof criteria === "function") {
            return this.copy({ criteria: matches(criteria(new WhereHelper())) });
        } else {
            return this.copy({ criteria: matches(criteria) });
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
