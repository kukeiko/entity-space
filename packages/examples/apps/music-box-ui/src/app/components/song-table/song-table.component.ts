import { Component, Input } from "@angular/core";
import { Workspace } from "@entity-space/core";
import { Artist, MusicSchemaCatalog, Song, WebSongLocation } from "@entity-space/examples/libs/music-model";

@Component({
    selector: "song-table",
    templateUrl: "./song-table.component.html",
    styleUrls: ["./song-table.component.scss"],
})
export class SongTableComponent {
    constructor(private readonly workspace: Workspace, private readonly schemas: MusicSchemaCatalog) {}

    @Input() songs: Song[] = [];

    columns: { field: string; header: string }[] = [
        { field: "id", header: "Id" },
        { field: "name", header: "Name" },
        { field: "artist", header: "Artist" },
        { field: "duration", header: "Duration" },
        { field: "url", header: "Url" },
    ];

    editDialogVisible = false;
    editedSong?: Song;
    artists$ = this.workspace.query$<Artist>(this.schemas.getArtistSchema());

    editSong(song: Song): void {
        // [todo] use some copying mechanism from entity-space instead
        this.editedSong = { ...song };
        console.log("✍ edit song", this.editedSong);
        this.editDialogVisible = true;
    }

    getUrl(song: Song): string | undefined {
        const webLocation = song.locations?.find(loc => loc.songLocationType === "web") as WebSongLocation | undefined;

        return webLocation?.url;
    }

    async saveSong(): Promise<void> {
        console.log("💾 save song", this.editedSong);
        await this.workspace.update([this.editedSong!], this.schemas.getSongSchema());
        this.hideDialog();
    }

    hideDialog() {
        this.editDialogVisible = false;
    }
}
