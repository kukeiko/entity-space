import { Component, OnDestroy, OnInit } from "@angular/core";
import { Blueprint, BlueprintResolver, define, Instance, Query, Workspace } from "@entity-space/core";
import { matches, some } from "@entity-space/criteria";
import {
    Artist,
    ArtistBlueprint,
    Song,
    SongBlueprint,
    SongLocation,
    SongLocationType,
    SongLocationTypeBlueprint,
} from "@entity-space/examples/libs/music-model";
import { pluckId, tramplePath } from "@entity-space/utils";
import { PrimeNGConfig } from "primeng/api";
import { combineLatest, map, of, Subject, switchMap, tap } from "rxjs";

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
}

@Blueprint({ id: "music-box-ui-state" })
class MusicBoxUiStateBlueprint {
    id = define(Number, { id: true, required: true });
    filter = define(MusicBoxUiFilter, { required: true });
}

type MusicBoxUiState = Instance<MusicBoxUiStateBlueprint>;

@Component({
    selector: "music-box-app",
    templateUrl: "./music-box-app.component.html",
    styleUrls: ["./music-box-app.component.scss"],
})
export class MusicAppComponent implements OnInit, OnDestroy {
    constructor(
        private primengConfig: PrimeNGConfig,
        private readonly workspace: Workspace,
        private readonly resolver: BlueprintResolver
    ) {}

    private readonly destroyed$ = new Subject<void>();

    stateId = 1;

    state$ = this.workspace.queryOneByKey$(MusicBoxUiStateBlueprint, this.stateId).pipe(
        switchMap(ui =>
            combineLatest([
                of(ui),
                this.workspace.query$(ArtistBlueprint, void 0, { id: true, name: true }),
                this.workspace.query$(SongLocationTypeBlueprint),
                this.workspace.query$(
                    SongBlueprint,
                    {
                        artistId: pluckId(ui.filter.artists),
                        locations: some(matches<SongLocation>({ songLocationType: pluckId(ui.filter.locationTypes) })),
                    },
                    { id: true, artistId: true, duration: true, name: true, locations: true }
                ),
            ])
        ),
        map(([ui, artists, songLocationTypes, songs]) => this.toAppState(ui, songs, artists, songLocationTypes)),
        tap(state => console.log("🧙‍♂️ app state changed", state))
    );

    toAppState(
        ui: MusicBoxUiState,
        songs: Song[],
        artists: Artist[],
        songLocationTypes: SongLocationType[]
    ): MusicBoxAppState {
        songs.sort((a, b) => a.name.localeCompare(b.name));
        artists.sort((a, b) => a.name.localeCompare(b.name));

        return { ui, data: { songs, artists, songLocationTypes } };
    }

    queriesIssuedAgainstApi: Query[] = [];
    queriesInWorkspaceCache: Query[] = [];

    ngOnInit(): void {
        this.workspace.add(MusicBoxUiStateBlueprint, {
            id: this.stateId,
            filter: { artists: [], locationTypes: [] },
        });

        this.workspace.add(SongLocationTypeBlueprint, [
            { id: "web", name: "Web" },
            { id: "local", name: "Local" },
        ]);

        this.primengConfig.ripple = true;
        this.workspace.onQueryCacheChanged().subscribe(queries => (this.queriesInWorkspaceCache = queries));
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    changeUiState(property: string, value: any): void {
        const change = {};
        tramplePath(property, change, value);
        this.workspace.add(this.resolver.resolve(MusicBoxUiStateBlueprint), {
            id: this.stateId,
            ...change,
        });
    }
}