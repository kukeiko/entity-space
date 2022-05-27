import { Component, OnInit } from "@angular/core";
import { EntitySchema, ExpansionObject, IEntitySchema, Query, Workspace } from "@entity-space/core";
import { any, Criterion, inSet, isValue, matches, some } from "@entity-space/criteria";
import { Artist, MusicSchemaCatalog, Song, SongLocation } from "@entity-space/examples/libs/music-model";
import { flatMap } from "lodash";
import { PrimeNGConfig } from "primeng/api";
import { merge } from "rxjs";
import { SongLocationEntitySource } from "./entity-sources/song-location.entity-source";
import { SongEntitySource } from "./entity-sources/song.entity-source";

interface IdNameRecord<K, V = string> {
    id: K;
    name: V;
}

interface MusicBoxAppState {
    id: number;
    selectedLocationType: IdNameRecord<string>[];
    selectedArtists: Artist[];
}

@Component({
    selector: "music-box-app",
    templateUrl: "./music-box-app.component.html",
    styleUrls: ["./music-box-app.component.scss"],
})
export class MusicAppComponent implements OnInit {
    constructor(
        private primengConfig: PrimeNGConfig,
        private readonly schemaCatalog: MusicSchemaCatalog,
        private readonly songSource: SongEntitySource,
        private readonly songLocationSource: SongLocationEntitySource,
        private readonly workspace: Workspace
    ) {
        const appStateSchema = new EntitySchema("music-box-app-state");
        appStateSchema.setKey("id");
        this.appStateSchema = appStateSchema;
    }

    private readonly appStateSchema: IEntitySchema;

    artists$ = this.workspace.query$_v2(this.schemaCatalog.getArtistSchema());

    stateId = 1;
    songs: Song[] = [];
    locationTypes: IdNameRecord<string>[] = [
        { id: "web", name: "Web" },
        { id: "local", name: "Local" },
    ];
    selectedLocationType: IdNameRecord<string>[] = [];
    selectedArtists: Artist[] = [];
    isLoadingSongs = false;

    ngOnInit(): void {
        this.workspace.add<MusicBoxAppState>(this.appStateSchema, [
            { id: this.stateId, selectedLocationType: [], selectedArtists: [] },
        ]);
        this.workspace
            .query$<MusicBoxAppState>(
                new Query(this.appStateSchema, matches<MusicBoxAppState>({ id: isValue(this.stateId) }))
            )
            .subscribe(appStates => {
                const appState = appStates[0]!;
                console.log("🧙‍♂️ app state changed!", appState);
                this.load();
            });

        this.primengConfig.ripple = true;

        merge(this.songSource.onQueryIssued(), this.songLocationSource.onQueryIssued()).subscribe(
            query => (this.queriesIssuedAgainstApi = [...this.queriesIssuedAgainstApi, query])
        );

        this.workspace.onQueryCacheChanged().subscribe(queries => (this.queriesInWorkspaceCache = queries));

        this.workspace.query$_v2<Song>(this.schemaCatalog.getSongSchema()).subscribe(songs => {
            console.log("🔥 hot songs!", songs);
            this.load();
            // this.songs = songs;
        });
    }
    getStuff() {
        console.log("getting stuff!");
        return "stuff";
    }
    async load(): Promise<void> {
        this.isLoadingSongs = true;
        const expansion: ExpansionObject<Song> = { locations: true, artist: true };
        const criterion = this.uiFilterToCriterion();
        const result = await this.workspace.query(new Query(this.schemaCatalog.getSongSchema(), criterion, expansion));
        // await new Promise(resolve => setTimeout(resolve, 500));

        if (!result) {
            this.songs = [];
        } else {
            this.songs = flatMap(result, x => x.getEntities()) as Song[];
        }

        this.isLoadingSongs = false;
    }

    private uiFilterToCriterion(): Criterion | undefined {
        return matches<Song>({
            artistId: this.selectedArtists.length > 0 ? inSet(this.selectedArtists.map(artist => artist.id)) : any(),
            locations:
                this.selectedLocationType.length > 0
                    ? some(matches<SongLocation>({ songLocationType: inSet(this.selectedLocationType.map(x => x.id)) }))
                    : any(),
        });

        // if (this.selectedLocationType.length > 0) {
        //     return matches<Song>({
        //         locations: some(
        //             matches<SongLocation>({ songLocationType: inSet(this.selectedLocationType.map(x => x.id)) })
        //         ),
        //     });
        // }

        // return void 0;
    }

    sliderValue = 7;
    queriesIssuedAgainstApi: Query[] = [];
    queriesInWorkspaceCache: Query[] = [];

    onSelectedLocationTypeChanged(selectedLocationType: IdNameRecord<string>[]): void {
        this.selectedLocationType = selectedLocationType;
        this.workspace.add<Partial<MusicBoxAppState>>(this.appStateSchema, [
            { id: this.stateId, selectedLocationType },
        ]);
    }

    onSelectedArtistsChanged(selectedArtists: Artist[]): void {
        this.selectedArtists = selectedArtists;
        this.workspace.add<Partial<MusicBoxAppState>>(this.appStateSchema, [{ id: this.stateId, selectedArtists }]);
    }
}
