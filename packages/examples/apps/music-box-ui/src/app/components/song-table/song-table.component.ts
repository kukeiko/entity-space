import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { Blueprint, define, SchemaCatalog, Workspace } from "@entity-space/core";
import { Artist, ArtistBlueprint, Song, SongBlueprint, WebSongLocation } from "@entity-space/examples/libs/music-model";
import { combineLatest, map, switchMap } from "rxjs";

@Blueprint({ id: "song-table-input" })
class SongTableInputBlueprint {
    id = define(Number, { id: true, required: true });
    songs = define(SongBlueprint, { array: true, required: true });
}

interface SongTableState {
    data: {
        artists: Artist[];
        songs: Song[];
    };
}

@Component({
    selector: "song-table",
    templateUrl: "./song-table.component.html",
    styleUrls: ["./song-table.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongTableComponent {
    constructor(private readonly workspace: Workspace, private readonly schemas: SchemaCatalog) {}

    stateId = 1;

    @Input() set songs(songs: Song[]) {
        this.workspace.add(SongTableInputBlueprint, [{ id: this.stateId, songs }]);
    }

    state$ = this.workspace.queryOneByKey$(SongTableInputBlueprint, this.stateId).pipe(
        switchMap(input =>
            combineLatest({
                artists: this.workspace.query$(ArtistBlueprint),
                songs: this.workspace.hydrate$(SongBlueprint, input.songs, { artist: true, locations: true }),
            })
        ),
        map(data => {
            const state: SongTableState = { data };

            return state;
        })
    );

    columns: { field: string; header: string }[] = [
        { field: "id", header: "Id" },
        { field: "name", header: "Name" },
        { field: "artist", header: "Artist" },
        { field: "duration", header: "Duration" },
        { field: "url", header: "Url" },
    ];

    editDialogVisible = false;
    editedSong?: Song;
    editedWebUrl = "";
    artists$ = this.workspace.query$(ArtistBlueprint);

    editSong(song: Song): void {
        // [todo] use some copying mechanism from entity-space instead
        this.editedSong = { ...song };
        this.editedWebUrl = this.getUrl(song) ?? "";
        console.log("✍ edit song", this.editedSong);
        this.editDialogVisible = true;
    }

    getUrl(song: Song): string | undefined {
        const webLocation = song.locations?.find(loc => loc.songLocationType === "web") as WebSongLocation | undefined;

        return webLocation?.url;
    }

    async saveSong(): Promise<void> {
        console.log("💾 save song", this.editedSong);

        if (this.editedWebUrl) {
            let webLocation = this.editedSong?.locations?.find(loc => loc.songLocationType === "web") as
                | WebSongLocation
                | undefined;

            if (!webLocation) {
                const createdWebLocation = await this.workspace.create<WebSongLocation>(
                    [{ id: 0, songId: this.editedSong?.id!, songLocationType: "web", url: this.editedWebUrl }],
                    this.schemas.getSchema("song-location")
                );

                if (!createdWebLocation) {
                    return;
                }

                webLocation = createdWebLocation[0];
            } else {
                webLocation.url = this.editedWebUrl;
                await this.workspace.update([webLocation], this.schemas.getSchema("song-location"));
            }
        }

        // [todo] make workspace.update() better to use w/ blueprints
        await this.workspace.update([this.editedSong!], this.schemas.resolve(SongBlueprint));
        this.hideDialog();
    }

    hideDialog() {
        this.editDialogVisible = false;
    }
}
