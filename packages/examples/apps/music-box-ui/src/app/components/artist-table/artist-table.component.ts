import { ChangeDetectionStrategy, Component, Input, OnInit } from "@angular/core";
import { Blueprint, define, SchemaCatalog, Workspace } from "@entity-space/core";
import { Artist, ArtistBlueprint } from "@entity-space/examples/libs/music-model";
import { combineLatest, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";

@Blueprint({ id: "artist-table-input" })
class ArtistTableInputBlueprint {
    id = define(Number, { id: true, required: true });
    artists = define(ArtistBlueprint, { array: true, required: true });
}

@Component({
    selector: "artist-table",
    templateUrl: "./artist-table.component.html",
    styleUrls: ["./artist-table.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtistTableComponent implements OnInit {
    constructor(private readonly workspace: Workspace, private readonly schemas: SchemaCatalog) {}

    columns: { field: string; header: string }[] = [{ field: "name", header: "Name" }];
    stateId = 1;

    @Input() set artists(artists: Artist[]) {
        this.workspace.add(ArtistTableInputBlueprint, [{ id: this.stateId, artists }]);
    }

    state$ = this.workspace.queryOneByKey$(ArtistTableInputBlueprint, this.stateId).pipe(
        switchMap(input =>
            combineLatest({
                artists: of(input.artists),
            })
        ),
        map(data => ({ data }))
    );

    ngOnInit(): void {}
}
