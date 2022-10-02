import { ChangeDetectionStrategy, Component, Input, OnInit } from "@angular/core";
import { Blueprint, define, EntitySchemaCatalog, Workspace } from "@entity-space/core";
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
    constructor(private readonly workspace: Workspace, private readonly schemas: EntitySchemaCatalog) {}

    columns: { field: string; header: string }[] = [{ field: "name", header: "Name" }];
    stateId = 1;
    editDialogVisible = false;
    editedEntity?: Artist;

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

    create(): void {
        // [todo] implement & use EntitySchema.createDefault()
        this.editedEntity = { id: 0, name: "" };
        this.editDialogVisible = true;
    }

    edit(entity: Artist): void {
        // [todo] use some copying mechanism from entity-space instead
        this.editedEntity = { ...entity };
        this.editDialogVisible = true;
    }

    async saveSong(): Promise<void> {
        console.log("💾 save entity", this.editedEntity);

        if (this.editedEntity?.id ?? 0 > 0) {
            // [todo] make workspace.update() better to use w/ blueprints
            await this.workspace.update([this.editedEntity!], this.schemas.resolve(ArtistBlueprint));
        } else {
            const created = await this.workspace.create([this.editedEntity!], this.schemas.resolve(ArtistBlueprint));

            if (!created) {
                return alert("could not create entity :(");
            }
        }

        this.hideDialog();
    }

    hideDialog() {
        this.editDialogVisible = false;
    }
}
