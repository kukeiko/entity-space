import { ChangeDetectionStrategy, Component, Input, OnInit } from "@angular/core";
import { EntitySchemaCatalog } from "@entity-space/core";
import { Artist, ArtistBlueprint } from "@entity-space/examples/libs/music-model";
import { ReplaySubject } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { MusicBoxWorkspace } from "../../music-box-workspace";

@Component({
    selector: "artist-table",
    templateUrl: "./artist-table.component.html",
    styleUrls: ["./artist-table.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtistTableComponent implements OnInit {
    constructor(private readonly entities: MusicBoxWorkspace, private readonly schemas: EntitySchemaCatalog) {}

    columns: { field: string; header: string }[] = [{ field: "name", header: "Name" }];
    editDialogVisible = false;
    editedEntity?: Artist;

    artistsInput$ = new ReplaySubject<Artist[]>(1);

    @Input("artists") set artists(artists: Artist[]) {
        this.artistsInput$.next(artists);
    }

    artists$ = this.artistsInput$.pipe(
        // [todo] use some meaningful hydration
        switchMap(artists => this.entities.scope(ArtistBlueprint).hydrate(artists, {})),
        map(artists => artists.sort((a, b) => a.name.localeCompare(b.name)))
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

    async saveArtist(): Promise<void> {
        console.log("💾 save entity", this.editedEntity);

        if (this.editedEntity?.id ?? 0 > 0) {
            // [todo] make workspace.update() better to use w/ blueprints
            await this.entities.update([this.editedEntity!], this.schemas.resolve(ArtistBlueprint));
        } else {
            const created = await this.entities.create([this.editedEntity!], this.schemas.resolve(ArtistBlueprint));

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
