import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from "@angular/core";
import { map } from "rxjs";
import { copySongFilter, createDefaultSongFilter, SongFilter } from "../../models";
import { MusicBoxWorkspace } from "../../music-box-workspace";
import { sortByName } from "../../sort-by-name.fn";

@Component({
    selector: "song-filter-bar",
    templateUrl: "./song-filter-bar.component.html",
    styleUrls: ["./song-filter-bar.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongFilterBarComponent {
    constructor(private readonly entities: MusicBoxWorkspace) {}

    @Input() set filter(value: SongFilter | null | undefined) {
        this.value = value ? copySongFilter(value) : createDefaultSongFilter();
    }

    @Output() filterChange = new EventEmitter<SongFilter>();
    value = createDefaultSongFilter();

    // [todo] support default sort via metadata
    artists$ = this.entities
        .fromArtists()
        .findAll()
        .pipe(
            map(({ entities }) => entities),
            map(sortByName)
        );

    locationTypes$ = this.entities
        .fromSongLocationTypes()
        .findAll()
        .pipe(
            map(({ entities }) => entities),
            map(sortByName)
        );

    emitChange(): void {
        this.filterChange.next(this.value);
    }
}
