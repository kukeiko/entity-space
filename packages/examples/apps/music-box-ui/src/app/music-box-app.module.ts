import { HttpClient, HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { BlueprintResolver, EntitySchema, EntitySourceGateway, SchemaCatalog, Workspace } from "@entity-space/core";
import { ArtistBlueprint, SongBlueprint } from "@entity-space/examples/libs/music-model";
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
import { MusicBoxClientSideEntityController } from "./music-box-app-client-side-entity.controller";
import { MusicAppComponent } from "./music-box-app.component";

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
        { provide: SchemaCatalog },
        {
            // [todo] copy pasted to music-box-api
            provide: BlueprintResolver,
            deps: [SchemaCatalog],
            useFactory: (schemas: SchemaCatalog) => {
                const blueprintResolver = new BlueprintResolver(schemas);

                const songLocationSchema = new EntitySchema("song-location");
                songLocationSchema.setKey("id");
                songLocationSchema.addIndex("songId");
                schemas.addSchema(songLocationSchema);
                songLocationSchema.addInteger("id");
                songLocationSchema.addInteger("songId");
                songLocationSchema.addString("url");
                songLocationSchema.addString("path");
                songLocationSchema.addString("songLocationType");
                songLocationSchema.addProperty("song", blueprintResolver.resolve(SongBlueprint));
                songLocationSchema.addRelation("song", "songId", "id");

                schemas.addSchema(blueprintResolver.resolve(ArtistBlueprint));
                schemas.addSchema(blueprintResolver.resolve(SongBlueprint));

                return blueprintResolver;
            },
        },
        {
            provide: MusicBoxClientSideEntityController,
            deps: [HttpClient, BlueprintResolver, SchemaCatalog],
            useFactory: (http: HttpClient, blueprints: BlueprintResolver, schemas: SchemaCatalog) => {
                const controller = new MusicBoxClientSideEntityController(http, blueprints, schemas);

                return controller
                    .withGetAllArtists()
                    .withGetAllSongs()
                    .withGetSongById()
                    .withGetSongLocationsBySongId();
            },
        },
        {
            provide: EntitySourceGateway,
            deps: [MusicBoxClientSideEntityController, SchemaCatalog],
            useFactory: (controller: MusicBoxClientSideEntityController, schemas: SchemaCatalog) => {
                console.log("🏭 new entity gateway [V3]");
                const gateway = new EntitySourceGateway([controller]);
                gateway.addStore(schemas.getSchema("song"), controller);
                gateway.addStore(schemas.getSchema("song-location"), controller);
                return gateway;
            },
        },
        {
            provide: Workspace,
            deps: [EntitySourceGateway, BlueprintResolver],
            useFactory: (gateway: EntitySourceGateway, blueprintResolver: BlueprintResolver) => {
                console.log("🏭 new workspace");
                const workspace = new Workspace();
                workspace.setSource(gateway);
                workspace.setHydrator(gateway);
                workspace.setStore(gateway);
                workspace.setBlueprintResolver(blueprintResolver);

                return workspace;
            },
        },
    ],
    bootstrap: [MusicAppComponent],
})
export class AppModule {}
