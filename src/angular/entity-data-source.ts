import { EntityBlueprint, PackedEntitySelection, SelectEntity } from "@entity-space/elements";
import { EntityWorkspace, QueryReactivityOptions } from "@entity-space/execution";
import { Class, moveArrayItem } from "@entity-space/utils";
import { BehaviorSubject, combineLatest, firstValueFrom, map, Observable, shareReplay, switchMap } from "rxjs";
import { EntityFilter } from "./entity-filter";

// a little delay to not spam server on frequent filter change
const REFRESH_DELAY = 1000;

export class EntityDataSource<B, F, S extends PackedEntitySelection<EntityBlueprint.Instance<B>>> {
    constructor(
        workspace: EntityWorkspace,
        blueprint: Class<B>,
        filter: EntityFilter<B, F, S>,
        select?: S,
        cacheKey?: unknown,
        reactive?: boolean | QueryReactivityOptions,
    ) {
        this.#workspace = workspace;
        this.#blueprint = blueprint;
        this.#filter = filter;
        this.#select = select;
        this.#cacheKey = cacheKey;
        this.#reactive = reactive ?? false;

        this.#entities$ = combineLatest({
            filter: this.#filter.getFilter$(),
            refresh: this.#refresh$,
        }).pipe(
            switchMap(({ filter }) => {
                return this.#load$(filter).pipe(map(entities => this.#filter.filterClientSide(filter, entities)));
            }),
            shareReplay(1),
        );
    }

    readonly #workspace: EntityWorkspace;
    readonly #blueprint: Class<B>;
    readonly #select?: S;
    readonly #filter: EntityFilter<B, F, S>;
    readonly #refresh$ = new BehaviorSubject(undefined);
    readonly #isLoading$ = new BehaviorSubject(false);
    readonly #entities$: Observable<SelectEntity<EntityBlueprint.Instance<B>, S>[]>;
    readonly #cacheKey?: unknown;
    readonly #reactive?: boolean | QueryReactivityOptions;

    getEntities$(): Observable<SelectEntity<EntityBlueprint.Instance<B>, S>[]> {
        return this.#entities$;
    }

    getEntities(): Promise<SelectEntity<EntityBlueprint.Instance<B>, S>[]> {
        return firstValueFrom(this.#entities$);
    }

    async moveEntity(
        from: number,
        to: number,
        assignIndex: (entity: SelectEntity<EntityBlueprint.Instance<B>, S>, index: number) => void,
    ): Promise<void> {
        const previous = await this.getEntities();
        const next = structuredClone(previous.slice());

        moveArrayItem(next, from, to);

        for (let index = 0; index < next.length; ++index) {
            assignIndex(next[index], index);
        }

        this.#isLoading$.next(true);
        await this.#workspace.in(this.#blueprint).update(next as any, previous as any);
        this.#isLoading$.next(false);
        // [todo] ❌ instead of reloading, we could just emit "next" as the new entities
        this.refresh();
    }

    getFilter$(): Observable<F> {
        return this.#filter.getFilter$();
    }

    patchFilter(patch: Partial<F>): void {
        this.#filter.patchFilter(patch);
    }

    isLoading$(): Observable<boolean> {
        return this.#isLoading$.asObservable();
    }

    refresh(): void {
        this.#refresh$.next(undefined);
    }

    // [todo] ❌ should skip REFRESH_DELAY if the criteria are only partially cached
    #load$(filter: F): Observable<SelectEntity<EntityBlueprint.Instance<B>, S>[]> {
        return this.#workspace
            .from(this.#blueprint)
            .select(this.#select ?? {})
            .where(this.#filter.toWhereEntity(filter))
            .cache({
                key: this.#cacheKey,
                refresh: true,
                refreshDelay: REFRESH_DELAY,
                reactive: this.#reactive,
            })
            .indicate(this.#isLoading$)
            .get$();
    }
}
