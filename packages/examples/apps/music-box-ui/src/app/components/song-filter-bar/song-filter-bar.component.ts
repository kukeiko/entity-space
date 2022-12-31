import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from "@angular/core";
import { EntityWorkspace } from "@entity-space/core";
import { ArtistBlueprint, SongLocationTypeBlueprint } from "@entity-space/examples/libs/music-model";
import { map } from "rxjs";
import { copySongFilter, createDefaultSongFilter, SongFilter } from "../../models";

@Component({
    selector: "song-filter-bar",
    templateUrl: "./song-filter-bar.component.html",
    styleUrls: ["./song-filter-bar.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongFilterBarComponent {
    constructor(private readonly entities: EntityWorkspace) {}

    @Input() set filter(value: SongFilter | null | undefined) {
        this.value = value ? copySongFilter(value) : createDefaultSongFilter();
    }

    @Output() filterChange = new EventEmitter<SongFilter>();
    value = createDefaultSongFilter();

    // [todo] support default sort via metadata
    artists$ = this.entities
        .scope(ArtistBlueprint)
        .all()
        .pipe(map(items => items.slice().sort((a, b) => a.name.localeCompare(b.name))));

    locationTypes$ = this.entities
        .scope(SongLocationTypeBlueprint)
        .all()
        .pipe(map(items => items.slice().sort((a, b) => a.name.localeCompare(b.name))));

    emitChange(): void {
        this.filterChange.next(this.value);
    }
}
