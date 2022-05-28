import { Component, OnDestroy, OnInit } from "@angular/core";
import { EntitySchema, Query, Workspace } from "@entity-space/core";
import { inSet, matches, some } from "@entity-space/criteria";
import { Artist, MusicSchemaCatalog, Song, SongLocation } from "@entity-space/examples/libs/music-model";
import { pluckId, tramplePath } from "@entity-space/utils";
import { PrimeNGConfig } from "primeng/api";
import { combineLatest, map, merge, Observable, of, Subject, switchMap } from "rxjs";
import { SongLocationEntitySource } from "./entity-sources/song-location.entity-source";
import { SongEntitySource } from "./entity-sources/song.entity-source";

interface IdNameRecord<K, V = string> {
    id: K;
    name: V;
}

type SongLocationType = IdNameRecord<string>;

interface MusicBoxUiState {
    id: number;
    filter: {
        locationTypes: IdNameRecord<string>[];
        artists: Artist[];
    };
}

interface MusicBoxAppState {
    data: {
        artists: Artist[];
        songs: Song[];
        songLocationTypes: SongLocationType[];
    };
    ui: MusicBoxUiState;
}

@Component({
    selector: "music-box-app",
    templateUrl: "./music-box-app.component.html",
    styleUrls: ["./music-box-app.component.scss"],
})
export class MusicAppComponent implements OnInit, OnDestroy {
    constructor(
        private primengConfig: PrimeNGConfig,
        private readonly schemaCatalog: MusicSchemaCatalog,
        private readonly songSource: SongEntitySource,
        private readonly songLocationSource: SongLocationEntitySource,
        private readonly workspace: Workspace
    ) {}

    private readonly uiStateSchema = new EntitySchema("music-box-ui-state").setKey("id");
    private readonly songLocationTypeSchema = new EntitySchema("song-location-type").setKey("id");
    private readonly destroyed$ = new Subject<void>();

    stateId = 1;

    state$ = this.workspace.queryOneByKey$<MusicBoxUiState>(this.uiStateSchema, this.stateId).pipe(
        switchMap(ui =>
            combineLatest([of(ui), this.getSongs$(ui.filter), this.getArtists$(), this.getSongLocationTypes$()])
        ),
        map(([ui, songs, artists, songLocationTypes]) => this.toAppState(ui, songs, artists, songLocationTypes))
    );

    getArtists$(): Observable<Artist[]> {
        return this.workspace.query$<Artist>(this.schemaCatalog.getArtistSchema());
    }

    getSongs$(filter: MusicBoxUiState["filter"]): Observable<Song[]> {
        return this.workspace.query$<Song>(
            this.schemaCatalog.getSongSchema(),
            matches<Song>({
                artistId: inSet(pluckId(filter.artists)),
                locations: some(
                    matches<SongLocation>({
                        songLocationType: inSet(pluckId(filter.locationTypes)),
                    })
                ),
            }),
            { artist: true, locations: true }
        );
    }

    getSongLocationTypes$(): Observable<SongLocationType[]> {
        return this.workspace.query$<SongLocationType>(this.songLocationTypeSchema);
    }

    toAppState(
        ui: MusicBoxUiState,
        songs: Song[],
        artists: Artist[],
        songLocationTypes: SongLocationType[]
    ): MusicBoxAppState {
        songs.sort((a, b) => a.name.localeCompare(b.name));
        artists.sort((a, b) => a.name.localeCompare(b.name));

        const state: MusicBoxAppState = {
            ui,
            data: { songs, artists, songLocationTypes },
        };

        console.log("🧙‍♂️ app state changed", state);
        return state;
    }

    queriesIssuedAgainstApi: Query[] = [];
    queriesInWorkspaceCache: Query[] = [];

    ngOnInit(): void {
        this.workspace.add<MusicBoxUiState>(this.uiStateSchema, {
            id: this.stateId,
            filter: { artists: [], locationTypes: [] },
        });

        this.workspace.add<IdNameRecord<string>[]>(this.songLocationTypeSchema, [
            { id: "web", name: "Web" },
            { id: "local", name: "Local" },
        ]);

        this.primengConfig.ripple = true;
        this.workspace.onQueryCacheChanged().subscribe(queries => (this.queriesInWorkspaceCache = queries));
        merge(this.songSource.onQueryIssued(), this.songLocationSource.onQueryIssued()).subscribe(
            query => (this.queriesIssuedAgainstApi = [...this.queriesIssuedAgainstApi, query])
        );
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    changeUiState(property: string, value: any): void {
        const change = {};
        tramplePath(property, change, value);
        this.workspace.add<MusicBoxUiState>(this.uiStateSchema, {
            id: this.stateId,
            ...change,
        });
    }
}
