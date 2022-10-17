import { HttpClient, HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { EntitySchemaCatalog } from "@entity-space/common";
import { EntityQueryTracing, EntitySourceGateway, Workspace } from "@entity-space/core";
import { SongBlueprint, SongLocationEntitySchema } from "@entity-space/examples/libs/music-model";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { DropdownModule } from "primeng/dropdown";
import { InputMaskModule } from "primeng/inputmask";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { MultiSelectModule } from "primeng/multiselect";
import { SliderModule } from "primeng/slider";
import { TableModule } from "primeng/table";
import { TabViewModule } from "primeng/tabview";
import { ArtistTableComponent } from "./components/artist-table/artist-table.component";
import { QueryCacheTableComponent } from "./components/query-cache-table/query-cache-table.component";
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
        InputMaskModule,
        InputNumberModule,
        InputTextModule,
        MultiSelectModule,
        SliderModule,
        TableModule,
        TabViewModule,
    ],
    declarations: [MusicAppComponent, SongTableComponent, ArtistTableComponent, QueryCacheTableComponent],
    providers: [
        SongLocationEntitySchema,
        {
            provide: EntityQueryTracing,
            useFactory: () => {
                const tracing = new EntityQueryTracing();
                tracing.enableConsole();
                return tracing;
            },
        },
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
            deps: [HttpClient, EntitySchemaCatalog, EntityQueryTracing],
            useFactory: (http: HttpClient, schemas: EntitySchemaCatalog, tracing: EntityQueryTracing) => {
                const controller = new MusicBoxClientSideEntityApi(http, schemas, tracing);

                return controller
                    .withGetAllArtists()
                    .withSearchSongs()
                    .withGetAllSongs()
                    .withGetSongById()
                    .withGetSongLocationsBySongId();
            },
        },
        {
            provide: EntitySourceGateway,
            deps: [MusicBoxClientSideEntityApi, EntitySchemaCatalog, EntityQueryTracing],
            useFactory: (
                controller: MusicBoxClientSideEntityApi,
                schemas: EntitySchemaCatalog,
                tracing: EntityQueryTracing
            ) => {
                console.log("🏭 new entity gateway");
                const gateway = new EntitySourceGateway([controller], tracing);
                // [todo] remove adding stores by schema
                gateway.addStore(schemas.getSchema("song"), controller);
                gateway.addStore(schemas.getSchema("song-location"), controller);
                gateway.addStore(schemas.getSchema("artist"), controller);
                return gateway;
            },
        },
        {
            provide: Workspace,
            deps: [EntitySourceGateway, EntitySchemaCatalog, EntityQueryTracing],
            useFactory: (gateway: EntitySourceGateway, schemas: EntitySchemaCatalog, tracing: EntityQueryTracing) => {
                console.log("🏭 new workspace");
                const workspace = new Workspace(tracing);
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
