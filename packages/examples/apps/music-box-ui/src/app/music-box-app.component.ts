import { Component, OnDestroy, OnInit } from "@angular/core";
import { Blueprint, BlueprintInstance, define, Entity, EntitySchemaCatalog } from "@entity-space/common";
import { Query, Workspace } from "@entity-space/core";
import { inRange, matches, some } from "@entity-space/criteria";
import {
    Artist,
    ArtistBlueprint,
    Song,
    SongBlueprint,
    SongLocation,
    SongLocationType,
    SongLocationTypeBlueprint,
} from "@entity-space/examples/libs/music-model";
import { isDefined, pluckId, writePath } from "@entity-space/utils";
import { PrimeNGConfig } from "primeng/api";
import { combineLatest, debounceTime, filter, map, of, shareReplay, Subject, switchMap, takeUntil } from "rxjs";

interface MusicBoxAppState {
    data: {
        artists: Artist[];
        songs: Song[];
        songLocationTypes: SongLocationType[];
    };
    ui: MusicBoxUiState;
}

@Blueprint({ id: "music-box-ui-filter" })
class MusicBoxUiFilter {
    artists = define(ArtistBlueprint, { array: true, required: true });
    locationTypes = define(SongLocationTypeBlueprint, { array: true, required: true });
    duration = define(Number, { array: true, required: true });
    paging = define(Number, { array: true, required: true });
    searchText = define(String);
    updateHack = define(String);
}

@Blueprint({ id: "music-box-ui-state" })
class MusicBoxUiStateBlueprint {
    id = define(Number, { id: true, required: true });
    filter = define(MusicBoxUiFilter, { required: true });
}

type MusicBoxUiState = BlueprintInstance<MusicBoxUiStateBlueprint>;

@Component({
    selector: "music-box-app",
    templateUrl: "./music-box-app.component.html",
    styleUrls: ["./music-box-app.component.scss"],
})
export class MusicAppComponent implements OnInit, OnDestroy {
    constructor(
        private primengConfig: PrimeNGConfig,
        private readonly workspace: Workspace,
        private readonly schemas: EntitySchemaCatalog
    ) {}

    private readonly destroyed$ = new Subject<void>();

    cachedQueries: Query[] = [];

    stateId = 1;
    uiState = this.workspace.scopeByBlueprint(MusicBoxUiStateBlueprint).oneById(this.stateId).pipe(filter(isDefined));
    artists = this.workspace.scopeByBlueprint(ArtistBlueprint);
    songLocationTypes = this.workspace.scopeByBlueprint(SongLocationTypeBlueprint);
    songs = this.workspace.scopeByBlueprint(SongBlueprint).withDefaultHydration({
        id: true,
        artistId: true,
        duration: true,
        name: true,
        // locations: { id: true, url: true, songLocationType: true },
        locations: { songLocationType: true },
    });

    state$ = this.uiState.pipe(
        switchMap(ui =>
            combineLatest([
                of(ui),
                this.artists.all(),
                this.songLocationTypes.all(),
                this.songs.many({
                    artistId: pluckId(ui.filter.artists),
                    locations: some(matches<SongLocation>({ songLocationType: pluckId(ui.filter.locationTypes) })),
                    duration: inRange(ui.filter.duration[0] ?? void 0, ui.filter.duration[1] ?? void 0),
                }),
            ])
        ),
        map(([ui, artists, songLocationTypes, songs]) => this.toState(ui, songs, artists, songLocationTypes)),
        shareReplay(1)
    );

    toState(
        ui: MusicBoxUiState,
        songs: Song[],
        artists: Artist[],
        songLocationTypes: SongLocationType[]
    ): MusicBoxAppState {
        songs.sort((a, b) => a.name.localeCompare(b.name));
        artists.sort((a, b) => a.name.localeCompare(b.name));

        return { ui, data: { songs, artists, songLocationTypes } };
    }

    ngOnInit(): void {
        this.workspace.add(MusicBoxUiStateBlueprint, {
            id: this.stateId,
            filter: { artists: [], locationTypes: [], duration: [0, 600], paging: [0, 3] },
        });

        this.workspace.add(SongLocationTypeBlueprint, [
            { id: "web", name: "Web" },
            { id: "local", name: "Local" },
        ]);

        this.primengConfig.ripple = true;

        this.workspace
            .queryCacheChanged$()
            .pipe(takeUntil(this.destroyed$))
            .subscribe(cachedQueries => (this.cachedQueries = cachedQueries));

        this.uiStateChange.pipe(takeUntil(this.destroyed$), debounceTime(0)).subscribe(change => {
            this.workspace.add(this.schemas.resolve(MusicBoxUiStateBlueprint), {
                id: this.stateId,
                ...change,
                // [todo] workspace doesn't see change for ui.filter.duration, so added this hack here
                updateHack: (Math.random() * 1337).toString(16),
            });
        });
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    private uiStateChange = new Subject<Entity>();

    changeUiState(property: string, value: any): void {
        this.uiStateChange.next(writePath(property, {}, value));
    }
}
