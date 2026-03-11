import { EntityBlueprint, PackedEntitySelection, SelectEntity, WhereEntity } from "@entity-space/elements";
import { EntityWorkspace, QueryReactivityOptions } from "@entity-space/execution";
import { Class } from "@entity-space/utils";
import { EntityDataSource } from "./entity-data-source";
import { EntityFilter, ObservableEntityFilterSource } from "./entity-filter";

export function createEntityDataSource<B, F, S extends PackedEntitySelection<EntityBlueprint.Type<B>>>({
    cacheKey,
    criteria,
    entityBlueprint,
    filter,
    filterBlueprint,
    interval,
    reactive,
    select,
    workspace,
}: {
    /**
     * An optional cache key you can provide in order to use a specific cache bucket.
     * In case you are passing a temporary key (such as the instance of an Angular component),
     * you should call {@link EntityWorkspace.destroyCache} in order to prevent memory leaks
     * once you no longer need the cache (e.g. during ngOnDestroy() in case of an Angular component).
     */
    cacheKey?: unknown;
    reactive?: boolean | QueryReactivityOptions;
    interval?: number;
    /**
     * Function that maps a filter object to the criteria that will be passed to one of the entity sources you have defined in the workspace.
     */
    criteria?: (filter: EntityBlueprint.Type<F>) => WhereEntity<EntityBlueprint.Type<B>>;
    /**
     * Blueprint of the entity this data source will provide.
     */
    entityBlueprint: Class<B>;
    /**
     * Additional client-side filter for anything the entity sources can't filter out.
     */
    filter?: (filter: EntityBlueprint.Type<F>, entity: SelectEntity<EntityBlueprint.Type<B>, S>) => boolean;
    /**
     * Blueprint of the filter you want to apply to the data source.
     */
    filterBlueprint: Class<F>;
    /**
     * The hydration selection that will be passed to one of the entity sources and all relevant hydrators you have defined in the workspace.
     */
    select?: S;
    /**
     * The workspace to use to load entities from.
     */
    workspace: EntityWorkspace;
}): EntityDataSource<B, EntityBlueprint.Type<F>, S> {
    const entityFilterSource = new ObservableEntityFilterSource(workspace, filterBlueprint);
    const entityFilter = new EntityFilter(entityFilterSource, criteria, filter, select);

    return new EntityDataSource(workspace, entityBlueprint, entityFilter, select, cacheKey, reactive, interval);
}
