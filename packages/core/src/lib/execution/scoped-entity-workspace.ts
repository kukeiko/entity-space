import { Entity, IEntitySchema, UnfoldedEntitySelection } from "@entity-space/common";
import { fromDeepBag, MatchesBagArgument } from "@entity-space/criteria";
import { DeepPartial, readPath, writePath } from "@entity-space/utils";
import { map, Observable } from "rxjs";
import { EntitySelection } from "../query/entity-selection";
import { EntityWorkspace } from "./entity-workspace";

export class ScopedEntityWorkspace<T extends Entity = Entity> {
    constructor({ schema, workspace }: { schema: IEntitySchema<T>; workspace: EntityWorkspace }) {
        this.schema = schema;
        this.workspace = workspace;
    }

    // private readonly blueprint: Class<T>;
    private readonly schema: IEntitySchema<T>;
    // private readonly schemas: EntitySchemaCatalog;
    private readonly workspace: EntityWorkspace;
    private defaultHydrate?: UnfoldedEntitySelection<T>;

    oneById(id: number | string | Entity, hydrate?: UnfoldedEntitySelection<T>): Observable<T | undefined> {
        let bag: Record<string, any>;
        const keyPaths = this.schema.getKey().getPath();

        if (keyPaths.length > 1) {
            if (typeof id !== "object") {
                throw new Error("composite id expected");
            }

            bag = {};

            for (const path of keyPaths) {
                bag = writePath(path, bag, readPath(path, id));
            }
        } else {
            bag = writePath(keyPaths[0], {}, id);
        }

        const criterion = fromDeepBag(bag);

        hydrate = EntitySelection.mergeValues(
            hydrate ?? this.schema.getDefaultSelection(),
            this.defaultHydrate ?? {}
        ) as UnfoldedEntitySelection<T>;

        return this.workspace.query$<T>(this.schema, criterion, hydrate).pipe(map(entities => entities[0]));
    }

    all(hydrate?: UnfoldedEntitySelection<T>): Observable<T[]> {
        hydrate = EntitySelection.mergeValues(
            hydrate ?? this.schema.getDefaultSelection(),
            this.defaultHydrate ?? {}
        ) as UnfoldedEntitySelection<T>;

        return this.workspace.query$<T>(this.schema, void 0, hydrate);
    }

    many(criteria: MatchesBagArgument<T>, hydrate?: UnfoldedEntitySelection<T>): Observable<T[]> {
        hydrate = EntitySelection.mergeValues(
            hydrate ?? this.schema.getDefaultSelection(),
            this.defaultHydrate ?? {}
        ) as UnfoldedEntitySelection<T>;

        return this.workspace.query$<T>(this.schema, criteria, hydrate);
    }

    withDefaultHydration(hydrate: UnfoldedEntitySelection<T>): this {
        this.defaultHydrate = hydrate;
        return this;
    }

    // [todo] not reactive yet
    hydrate(entities: T[], selection: UnfoldedEntitySelection<T>): Observable<T[]> {
        return this.workspace.hydrate$(this.schema, entities, selection);
    }

    async add(entities: DeepPartial<T>[]): Promise<void> {
        return await this.workspace.add(this.schema, entities);
    }
}
