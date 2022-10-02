import { HttpClient, HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { EntitySchemaCatalog, EntitySourceGateway, Workspace } from "@entity-space/core";
import { SongBlueprint, SongLocationEntitySchema } from "@entity-space/examples/libs/music-model";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { DropdownModule } from "primeng/dropdown";
import { InputTextModule } from "primeng/inputtext";
import { MultiSelectModule } from "primeng/multiselect";
import { SliderModule } from "primeng/slider";
import { TableModule } from "primeng/table";
import { TabViewModule } from "primeng/tabview";
import { ArtistTableComponent } from "./components/artist-table/artist-table.component";
import { SongTableComponent } from "./components/song-table/song-table.component";
import { MusicAppComponent } from "./music-box-app.component";
import { MusicBoxClientSideEntityApi } from "./music-box-client-side-entity-api";

@NgModule({
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        ButtonModule,
        DialogModule,
        DropdownModule,
        FormsModule,
        HttpClientModule,
        InputTextModule,
        MultiSelectModule,
        SliderModule,
        TableModule,
        TabViewModule,
    ],
    declarations: [MusicAppComponent, SongTableComponent, ArtistTableComponent],
    providers: [
        SongLocationEntitySchema,
        {
            // [todo] copy pasted to music-box-api
            provide: EntitySchemaCatalog,
            deps: [SongLocationEntitySchema],
            useFactory: (songLocationSchema: SongLocationEntitySchema) => {
                const schemas = new EntitySchemaCatalog();
                schemas.addSchema(songLocationSchema);
                songLocationSchema.addProperty("song", schemas.resolve(SongBlueprint));
                songLocationSchema.addRelation("song", "songId", "id");

                return schemas;
            },
        },
        {
            provide: MusicBoxClientSideEntityApi,
            deps: [HttpClient, EntitySchemaCatalog],
            useFactory: (http: HttpClient, schemas: EntitySchemaCatalog) => {
                const controller = new MusicBoxClientSideEntityApi(http, schemas);

                return controller
                    .withGetAllArtists()
                    .withGetAllSongs()
                    .withGetSongById()
                    .withGetSongLocationsBySongId();
            },
        },
        {
            provide: EntitySourceGateway,
            deps: [MusicBoxClientSideEntityApi, EntitySchemaCatalog],
            useFactory: (controller: MusicBoxClientSideEntityApi, schemas: EntitySchemaCatalog) => {
                console.log("🏭 new entity gateway [V3]");
                const gateway = new EntitySourceGateway([controller]);
                gateway.addStore(schemas.getSchema("song"), controller);
                gateway.addStore(schemas.getSchema("song-location"), controller);
                return gateway;
            },
        },
        {
            provide: Workspace,
            deps: [EntitySourceGateway, EntitySchemaCatalog],
            useFactory: (gateway: EntitySourceGateway, schemas: EntitySchemaCatalog) => {
                console.log("🏭 new workspace");
                const workspace = new Workspace();
                workspace.setSource(gateway);
                workspace.setHydrator(gateway);
                workspace.setStore(gateway);
                workspace.setSchemaCatalog(schemas);

                return workspace;
            },
        },
    ],
    bootstrap: [MusicAppComponent],
})
export class AppModule {}
