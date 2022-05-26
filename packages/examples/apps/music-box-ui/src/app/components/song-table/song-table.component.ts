import { Component, Input, OnInit } from "@angular/core";
import { Song } from "@entity-space/examples/libs/music-model";

@Component({
    selector: "song-table",
    templateUrl: "./song-table.component.html",
    styleUrls: ["./song-table.component.scss"],
})
export class SongTableComponent implements OnInit {
    constructor() {}

    @Input() songs: Song[] = [];

    columns: { field: keyof Song; header: string }[] = [
        { field: "id", header: "Id" },
        { field: "name", header: "Name" },
    ];

    ngOnInit(): void {}

    onEditSongClicked(song: Song): void {
        console.log(song);
    }
}
