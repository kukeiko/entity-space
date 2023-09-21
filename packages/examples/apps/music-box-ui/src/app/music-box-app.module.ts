import { HttpClient, HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { EntityQueryTracing, EntitySchemaCatalog, EntityWorkspace } from "@entity-space/core";
import { SongBlueprint, SongLocationEntitySchema } from "@entity-space/examples/libs/music-model";
import { EntityWorkspaceContext } from "packages/core/src/lib/execution/entity-workspace-context";
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
import { SongFilterBarComponent } from "./components/song-filter-bar/song-filter-bar.component";
import { SongTableComponent } from "./components/song-table/song-table.component";
import { MusicAppComponent } from "./music-box-app.component";
import { MusicBoxClientSideEntityApi } from "./music-box-client-side-entity-api";
import { MusicBoxWorkspace } from "./music-box-workspace";

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
    declarations: [
        ArtistTableComponent,
        MusicAppComponent,
        QueryCacheTableComponent,
        SongFilterBarComponent,
        SongTableComponent,
    ],
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
                    .withGetSongById()
                    .withGetAllSongs()
                    .withSearchSongs()
                    .withGetSongLocationsBySongId()
                    .withGetAllSongLocationTypes();
            },
        },
        {
            provide: EntityWorkspaceContext,
            deps: [EntitySchemaCatalog, EntityQueryTracing, MusicBoxClientSideEntityApi],
            useFactory: (
                catalog: EntitySchemaCatalog,
                tracing: EntityQueryTracing,
                clientSideEntityApi: MusicBoxClientSideEntityApi
            ) => {
                const context = new EntityWorkspaceContext(catalog, tracing);
                context.pushSource(clientSideEntityApi);
                context.pushStore(clientSideEntityApi);

                return context;
            },
        },

        {
            provide: MusicBoxWorkspace,
            deps: [EntityWorkspaceContext],
            useFactory: (context: EntityWorkspaceContext) => {
                return new MusicBoxWorkspace(context);
            },
        },
        {
            provide: EntityWorkspace,
            deps: [MusicBoxWorkspace],
            useFactory: (workspace: MusicBoxWorkspace) => workspace,
        },
    ],
    bootstrap: [MusicAppComponent],
})
export class AppModule {}
