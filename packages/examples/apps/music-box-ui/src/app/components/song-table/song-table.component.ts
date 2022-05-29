import { Component, Input } from "@angular/core";
import { BlueprintResolver, Workspace } from "@entity-space/core";
import { ArtistBlueprint, Song, SongBlueprint, WebSongLocation } from "@entity-space/examples/libs/music-model";

@Component({
    selector: "song-table",
    templateUrl: "./song-table.component.html",
    styleUrls: ["./song-table.component.scss"],
})
export class SongTableComponent {
    constructor(private readonly workspace: Workspace, private readonly blueprintResolver: BlueprintResolver) {}

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
    artists$ = this.workspace.query$(ArtistBlueprint);

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
        // [todo] make workspace.update() better to use w/ blueprints
        await this.workspace.update([this.editedSong!], this.blueprintResolver.resolve(SongBlueprint));
        this.hideDialog();
    }

    hideDialog() {
        this.editDialogVisible = false;
    }
}
