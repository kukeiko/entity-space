import { Entity, EntitySelectionValue, IEntitySchema } from "@entity-space/common";
import { fromDeepBag, MatchesBagArgument } from "@entity-space/criteria";
import { readPath, writePath } from "@entity-space/utils";
import { map, Observable } from "rxjs";
import { EntitySelection } from "../query/entity-selection";
import { EntityWorkspace } from "./entity-workspace";

export class ScopedEntityWorkspace<T extends Entity = Entity> {
    constructor({ schema, workspace }: { schema: IEntitySchema<T>; workspace: EntityWorkspace }) {
        this.schema = schema;
        this.workspace = workspace;
    }

    // private readonly blueprint: Class<T>;
    private readonly schema: IEntitySchema;
    // private readonly schemas: EntitySchemaCatalog;
    private readonly workspace: EntityWorkspace;
    private defaultHydrate: EntitySelectionValue<T> = true;

    oneById(id: number | string | Entity, hydrate: EntitySelectionValue<T> = true): Observable<T | undefined> {
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

        hydrate = EntitySelection.mergeValues(this.schema, hydrate, this.defaultHydrate) as EntitySelectionValue<T>;

        return this.workspace.query$<T>(this.schema, criterion, hydrate).pipe(map(entities => entities[0]));
    }

    all(hydrate: EntitySelectionValue<T> = true): Observable<T[]> {
        hydrate = EntitySelection.mergeValues(this.schema, hydrate, this.defaultHydrate) as EntitySelectionValue<T>;

        return this.workspace.query$<T>(this.schema, void 0, hydrate);
    }

    many(criteria: MatchesBagArgument<T>, hydrate: EntitySelectionValue<T> = true): Observable<T[]> {
        hydrate = EntitySelection.mergeValues(this.schema, hydrate, this.defaultHydrate) as EntitySelectionValue<T>;

        return this.workspace.query$<T>(this.schema, criteria, hydrate);
    }

    withDefaultHydration(hydrate: EntitySelectionValue<T>): this {
        this.defaultHydrate = hydrate;
        return this;
    }
}
