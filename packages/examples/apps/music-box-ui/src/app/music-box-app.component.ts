import { Component, OnInit } from "@angular/core";
import { EntitySourceGateway, ExpansionObject, Query, Workspace } from "@entity-space/core";
import { Criterion, inSet, matches, some } from "@entity-space/criteria";
import { MusicSchemaCatalog, Song, SongLocation } from "@entity-space/examples/libs/music-model";
import { PrimeNGConfig } from "primeng/api";
import { merge } from "rxjs";
import { SongLocationEntitySource } from "./entity-sources/song-location.entity-source";
import { SongEntitySource } from "./entity-sources/song.entity-source";

interface IdNameRecord<K, V = string> {
    id: K;
    name: V;
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
        private readonly songLocationSource: SongLocationEntitySource
    ) {
        this.gateway = new EntitySourceGateway();
        this.gateway.addSource(songSource.getEntitySchema(), songSource);
        this.gateway.addSource(songLocationSource.getEntitySchema(), songLocationSource);
        this.workspace = new Workspace();
        this.workspace.setSource(this.gateway);
    }

    private readonly gateway: EntitySourceGateway;
    private readonly workspace: Workspace;
    songs: Song[] = [];
    locationTypes: IdNameRecord<string>[] = [
        { id: "web", name: "Web" },
        { id: "local", name: "Local" },
    ];
    selectedLocationType: IdNameRecord<string>[] = [];
    isLoadingSongs = false;

    ngOnInit(): void {
        this.primengConfig.ripple = true;

        merge(this.songSource.onQueryIssued(), this.songLocationSource.onQueryIssued()).subscribe(
            query => (this.queriesIssuedAgainstApi = [...this.queriesIssuedAgainstApi, query])
        );

        this.workspace.onQueryCacheChanged().subscribe(queries => (this.queriesInWorkspaceCache = queries));
    }

    async load(): Promise<void> {
        this.isLoadingSongs = true;
        const expansion: ExpansionObject<Song> = { locations: true };
        const criterion = this.uiFilterToCriterion();
        const result = await this.workspace.query(new Query(this.schemaCatalog.getSongSchema(), criterion, expansion));
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!result) {
            this.songs = [];
        } else {
            this.songs = result
                .map(queried => queried.getEntities())
                .reduce((acc, value) => [...acc, ...value], []) as Song[];
        }

        console.log(this.songs);

        this.isLoadingSongs = false;
    }

    private uiFilterToCriterion(): Criterion | undefined {
        if (this.selectedLocationType.length > 0) {
            return matches<Song>({
                locations: some(
                    matches<SongLocation>({ songLocationType: inSet(this.selectedLocationType.map(x => x.id)) })
                ),
            });
        }

        return void 0;
    }

    sliderValue = 7;
    queriesIssuedAgainstApi: Query[] = [];
    queriesInWorkspaceCache: Query[] = [];
}
