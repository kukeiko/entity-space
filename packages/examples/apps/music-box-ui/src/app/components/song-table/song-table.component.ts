import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { Blueprint, define, EntitySchemaCatalog } from "@entity-space/common";
import { Workspace } from "@entity-space/core";
import { Artist, ArtistBlueprint, Song, SongBlueprint, WebSongLocation } from "@entity-space/examples/libs/music-model";
import { combineLatest, map, shareReplay, switchMap } from "rxjs";

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
    constructor(private readonly workspace: Workspace, private readonly schemas: EntitySchemaCatalog) {}

    stateId = 1;

    @Input() set songs(songs: Song[]) {
        this.workspace.add(SongTableInputBlueprint, [{ id: this.stateId, songs }]);
    }

    state$ = this.workspace.queryOneByKey$(SongTableInputBlueprint, this.stateId).pipe(
        switchMap(input =>
            combineLatest({
                artists: this.workspace.query$(ArtistBlueprint),
                songs: this.workspace.hydrate$(SongBlueprint, input.songs, {
                    artist: true,
                    // [todo] expanding song here causes all to load all songs,
                    // expecting it to be cached instead
                    locations: { id: true },
                }),
            })
        ),
        map(({ artists, songs }) => this.toState(artists, songs)),
        shareReplay(1)
    );

    toState(artists: Artist[], songs: Song[]): SongTableState {
        artists.sort((a, b) => a.name.localeCompare(b.name));
        return { data: { artists, songs } };
    }

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
    editedDuration = "";

    createSong(): void {
        // [todo] implement & use EntitySchema.createDefault()
        this.editedSong = { artistId: 0, duration: 0, id: 0, name: "" };
        this.editedWebUrl = "";
        this.editedDuration = "";
        this.editDialogVisible = true;
    }

    editSong(song: Song): void {
        // [todo] use some copying mechanism from entity-space instead
        this.editedSong = { ...song };
        this.editedWebUrl = this.getUrl(song) ?? "";
        this.editedDuration = this.secondsToTimeString(song.duration);
        console.log("✍ edit song", this.editedSong);
        this.editDialogVisible = true;
    }

    getUrl(song: Song): string | undefined {
        const webLocation = song.locations?.find(loc => loc.songLocationType === "web") as WebSongLocation | undefined;

        return webLocation?.url;
    }

    secondsToTimeString(seconds?: number): string {
        return new Date(1000 * (seconds ?? 0)).toISOString().slice(14, 19);
    }

    getEditedDuration(): number {
        const [seconds, minutes] = this.editedDuration
            .split(":")
            .reverse()
            .map(value => +value);

        return seconds + minutes * 60;
    }

    async saveSong(): Promise<void> {
        console.log("💾 save song", this.editedSong);
        if (!this.editedSong) {
            return;
        }

        this.editedSong.duration = this.getEditedDuration();

        if (this.editedSong?.id ?? 0 > 0) {
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
        } else {
            const createdSong = await this.workspace.create([this.editedSong!], this.schemas.resolve(SongBlueprint));

            if (!createdSong) {
                return alert("could not create song :(");
            }

            await this.workspace.create<WebSongLocation>(
                [{ id: 0, songId: createdSong[0].id, songLocationType: "web", url: this.editedWebUrl }],
                this.schemas.getSchema("song-location")
            );
        }

        this.hideDialog();
    }

    hideDialog() {
        this.editDialogVisible = false;
    }
}
