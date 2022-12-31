import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from "@angular/core";
import { EntitySchemaCatalog } from "@entity-space/common";
import { EntityWorkspace } from "@entity-space/core";
import { ArtistBlueprint, Song, SongBlueprint, WebSongLocation } from "@entity-space/examples/libs/music-model";
import { map, ReplaySubject, switchMap } from "rxjs";

@Component({
    selector: "song-table",
    templateUrl: "./song-table.component.html",
    styleUrls: ["./song-table.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongTableComponent {
    constructor(
        private readonly entities: EntityWorkspace,
        private readonly schemas: EntitySchemaCatalog,
        private readonly changeDetector: ChangeDetectorRef
    ) {}

    artists$ = this.entities
        .scope(ArtistBlueprint)
        .all()
        .pipe(map(items => items.slice().sort((a, b) => a.name.localeCompare(b.name))));

    songInput$ = new ReplaySubject<Song[]>(1);

    @Input("songs") set songInput(songs: Song[]) {
        this.songInput$.next(songs);
    }

    songs$ = this.songInput$.pipe(
        switchMap(songs =>
            this.entities.scope(SongBlueprint).hydrate(songs, { artist: true, locations: { id: true, url: true } })
        ),
        map(songs => songs.slice().sort((a, b) => a.name.localeCompare(b.name)))
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
                    const createdWebLocation = await this.entities.create<WebSongLocation>(
                        [{ id: 0, songId: this.editedSong?.id!, songLocationType: "web", url: this.editedWebUrl }],
                        this.schemas.getSchema("song-location")
                    );

                    if (!createdWebLocation) {
                        return;
                    }

                    webLocation = createdWebLocation[0];
                } else {
                    webLocation.url = this.editedWebUrl;
                    await this.entities.update([webLocation], this.schemas.getSchema("song-location"));
                }
            }

            // [todo] make workspace.update() better to use w/ blueprints
            await this.entities.update([this.editedSong!], this.schemas.resolve(SongBlueprint));
        } else {
            const createdSong = await this.entities.create([this.editedSong!], this.schemas.resolve(SongBlueprint));

            if (!createdSong) {
                return alert("could not create song :(");
            }

            await this.entities.create<WebSongLocation>(
                [{ id: 0, songId: createdSong[0].id, songLocationType: "web", url: this.editedWebUrl }],
                this.schemas.getSchema("song-location")
            );
        }

        this.hideDialog();
    }

    hideDialog() {
        this.editDialogVisible = false;
        this.changeDetector.markForCheck();
    }
}
