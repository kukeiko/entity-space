import { BlueprintInstance, Entity, EntitySchemaCatalog, ExpansionValue, IEntitySchema } from "@entity-space/common";
import { fromDeepBag, MatchesBagArgument } from "@entity-space/criteria";
import { Class, readPath, writePath } from "@entity-space/utils";
import { map, Observable, of } from "rxjs";
import { Workspace } from "../entity/workspace";
import { Expansion } from "../expansion/expansion";

export class ScopedByBlueprintWorkspace<T> {
    constructor({
        blueprint,
        schemas,
        workspace,
    }: {
        blueprint: Class<T>;
        schemas: EntitySchemaCatalog;
        workspace: Workspace;
    }) {
        // this.blueprint = blueprint;
        this.schema = schemas.resolve(blueprint);
        // this.schemas = schemas;
        this.workspace = workspace;
    }

    // private readonly blueprint: Class<T>;
    private readonly schema: IEntitySchema;
    // private readonly schemas: EntitySchemaCatalog;
    private readonly workspace: Workspace;
    private defaultHydrate: ExpansionValue<BlueprintInstance<T>> = true;

    oneById(
        id: number | string | Entity,
        hydrate: ExpansionValue<BlueprintInstance<T>> = true
    ): Observable<BlueprintInstance<T> | undefined> {
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

        hydrate = Expansion.mergeValues(this.schema, hydrate, this.defaultHydrate) as ExpansionValue<
            BlueprintInstance<T>
        >;

        return this.workspace
            .query$<BlueprintInstance<T>>(this.schema, criterion, hydrate)
            .pipe(map(entities => entities[0]));
    }

    all(hydrate: ExpansionValue<BlueprintInstance<T>> = true): Observable<BlueprintInstance<T>[]> {
        hydrate = Expansion.mergeValues(this.schema, hydrate, this.defaultHydrate) as ExpansionValue<
            BlueprintInstance<T>
        >;

        return this.workspace.query$<BlueprintInstance<T>>(this.schema, void 0, hydrate);
    }

    many(
        criteria: MatchesBagArgument<BlueprintInstance<T>>,
        hydrate: ExpansionValue<BlueprintInstance<T>> = true
    ): Observable<BlueprintInstance<T>[]> {
        hydrate = Expansion.mergeValues(this.schema, hydrate, this.defaultHydrate) as ExpansionValue<
            BlueprintInstance<T>
        >;

        return this.workspace.query$<BlueprintInstance<T>>(this.schema, criteria, hydrate);
    }

    withDefaultHydration(hydrate: ExpansionValue<BlueprintInstance<T>>): this {
        this.defaultHydrate = hydrate;
        return this;
    }
}
