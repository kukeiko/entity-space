import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { BlueprintResolver, EntitySchema, EntitySourceGateway, SchemaCatalog, Workspace } from "@entity-space/core";
import { SongBlueprint } from "@entity-space/examples/libs/music-model";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { DropdownModule } from "primeng/dropdown";
import { InputTextModule } from "primeng/inputtext";
import { MultiSelectModule } from "primeng/multiselect";
import { SliderModule } from "primeng/slider";
import { TableModule } from "primeng/table";
import { TabViewModule } from "primeng/tabview";
import { SongTableComponent } from "./components/song-table/song-table.component";
import { ArtistEntitySource } from "./entity-sources/artist.entity-source";
import { SongLocationEntitySource } from "./entity-sources/song-location.entity-source";
import { SongEntitySource } from "./entity-sources/song.entity-source";
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
    declarations: [MusicAppComponent, SongTableComponent],
    providers: [
        ArtistEntitySource,
        SongEntitySource,
        { provide: SchemaCatalog },
        {
            // [todo] copy pasted to music-box-api
            provide: BlueprintResolver,
            deps: [SchemaCatalog],
            useFactory: (schemaCatalog: SchemaCatalog) => {
                const blueprintResolver = new BlueprintResolver(schemaCatalog);

                const songLocationSchema = new EntitySchema("song-location");
                songLocationSchema.setKey("id");
                songLocationSchema.addIndex("songId");
                schemaCatalog.addSchema(songLocationSchema);
                songLocationSchema.addProperty("song", blueprintResolver.resolve(SongBlueprint));
                songLocationSchema.addRelation("song", "songId", "id");

                return blueprintResolver;
            },
        },
        SongLocationEntitySource,
        {
            provide: EntitySourceGateway,
            deps: [ArtistEntitySource, SongEntitySource, SongLocationEntitySource],
            useFactory: (
                artistSource: ArtistEntitySource,
                songSource: SongEntitySource,
                songLocationSource: SongLocationEntitySource
            ) => {
                console.log("🏭 new entity gateway");
                const gateway = new EntitySourceGateway();
                gateway.addSource(artistSource.getEntitySchema(), artistSource);
                gateway.addSource(songSource.getEntitySchema(), songSource);
                gateway.addStore(songSource.getEntitySchema(), songSource);
                gateway.addSource(songLocationSource.getEntitySchema(), songLocationSource);

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
                workspace.setStore(gateway);
                workspace.setBlueprintResolver(blueprintResolver);

                return workspace;
            },
        },
    ],
    bootstrap: [MusicAppComponent],
})
export class AppModule {}
