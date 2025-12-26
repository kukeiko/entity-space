import { ActivatedRoute, Params, Router } from "@angular/router";
import { EntityBlueprint, PackedEntitySelection, SelectEntity, WhereEntity } from "@entity-space/elements";
import { isEqual } from "lodash";
import { Observable, distinctUntilChanged, map } from "rxjs";
import { EntityFilterSchema, EntityFilterSchemaProperty, EntityFilterSource } from "./entity-filter-schema";

export class EntityFilter<B, F, S extends PackedEntitySelection<EntityBlueprint.Type<B>>> {
    constructor(
        source: EntityFilterSource<F>,
        toWhereEntityFn?: (filter: F) => WhereEntity<EntityBlueprint.Type<B>>,
        clientSideFilterFn?: (filter: F, entity: SelectEntity<EntityBlueprint.Type<B>, S>) => boolean,
        select?: S,
    ) {
        this.#source = source;
        this.#toWhereEntityFn = toWhereEntityFn;
        this.#clientSideFilterFn = clientSideFilterFn;
        this.#select = select;
    }

    #source: EntityFilterSource<F>;
    #toWhereEntityFn?: (filter: F) => WhereEntity<EntityBlueprint.Instance<B>>;
    #clientSideFilterFn?: (filter: F, entity: SelectEntity<EntityBlueprint.Type<B>, S>) => boolean;
    #select?: S;

    getFilter$(): Observable<F> {
        return this.#source.getFilter$();
    }

    patchFilter(patch: Partial<F>): void {
        this.#source.patchFilter(patch);
    }

    toWhereEntity(filter: F): WhereEntity {
        if (!this.#toWhereEntityFn) {
            return {};
        }

        return this.#toWhereEntityFn(filter);
    }

    filterClientSide(
        filter: F,
        entities: SelectEntity<EntityBlueprint.Type<B>, S>[],
    ): SelectEntity<EntityBlueprint.Type<B>, S>[] {
        const filterFn = this.#clientSideFilterFn;

        if (!filterFn) {
            return entities;
        }

        return entities.filter(entity => filterFn(filter, entity));
    }
}

export class RoutedEntityFilterSource<T> implements EntityFilterSource<T> {
    constructor(schema: EntityFilterSchema<T>, router: Router, activatedRoute: ActivatedRoute) {
        this.#schema = schema;
        this.#router = router;
        this.#activatedRoute = activatedRoute;
        this.#filter$ = this.#activatedRoute.queryParams.pipe(
            map(queryParams => this.#toFilterFromRouteParams(queryParams)),
            distinctUntilChanged(isEqual),
        );
    }

    readonly #schema: EntityFilterSchema<T>;
    readonly #router: Router;
    readonly #activatedRoute: ActivatedRoute;
    readonly #filter$: Observable<T>;

    getFilter$(): Observable<T> {
        return this.#filter$;
    }

    patchFilter(patch: Partial<T>): void {
        const queryParams: Params = {};

        for (const [key, value] of Object.entries(patch)) {
            const property = (this.#schema as any)[key] as EntityFilterSchemaProperty<any>;
            queryParams[key] = property.stringify(value);
        }

        this.#router.navigate([], {
            relativeTo: this.#activatedRoute,
            queryParams,
            queryParamsHandling: "merge",
            replaceUrl: true,
        });
    }

    #toFilterFromRouteParams(params: Params): T {
        const filter: Record<string, any> = {};

        for (const [key, property] of Object.entries(this.#schema) as [string, EntityFilterSchemaProperty<any>][]) {
            filter[key] = property.parse(params[key] ?? undefined);
        }

        return filter as T;
    }
}
