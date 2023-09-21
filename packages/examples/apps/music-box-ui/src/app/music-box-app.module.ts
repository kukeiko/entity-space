import { HttpClient, HttpClientModule } from "@angular/common/http";
import { NgModule, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { EntityQueryTracing, EntitySchemaCatalog, EntitySpaceServices, EntityWorkspace } from "@entity-space/core";
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
        { provide: EntitySchemaCatalog },
        { provide: EntityQueryTracing },
        { provide: EntitySpaceServices },
        SongLocationEntitySchema,
        {
            provide: MusicBoxWorkspace,
            deps: [EntitySpaceServices],
            useFactory: (services: EntitySpaceServices) => {
                return new MusicBoxWorkspace(services);
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
export class AppModule {
    constructor(
        services: EntitySpaceServices,
        clientSideEntityApi: MusicBoxClientSideEntityApi,
        songLocationSchema: SongLocationEntitySchema
    ) {
        services.getCatalog().addSchema(songLocationSchema);
        songLocationSchema.addProperty("song", services.getCatalog().resolve(SongBlueprint));
        songLocationSchema.addRelation("song", "songId", "id");
        services.pushSource(clientSideEntityApi);
        services.pushHydrator(clientSideEntityApi);
        services.getTracing().enableConsole();

        services.pushSource(
            clientSideEntityApi
                .withGetAllArtists()
                .withGetSongById()
                .withGetAllSongs()
                .withSearchSongs()
                .withGetSongLocationsBySongId()
                .withGetAllSongLocationTypes()
        );
    }
}
