import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MusicSchemaCatalog } from "@entity-space/examples/libs/music-model";
import { ButtonModule } from "primeng/button";
import { MultiSelectModule } from "primeng/multiselect";
import { SliderModule } from "primeng/slider";
import { TableModule } from "primeng/table";
import { SongTableComponent } from "./components/song-table/song-table.component";
import { SongLocationEntitySource } from "./entity-sources/song-location.entity-source";
import { SongEntitySource } from "./entity-sources/song.entity-source";
import { MusicAppComponent } from "./music-box-app.component";

@NgModule({
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        ButtonModule,
        FormsModule,
        HttpClientModule,
        SliderModule,
        TableModule,
        MultiSelectModule,
    ],
    declarations: [MusicAppComponent, SongTableComponent],
    providers: [
        { provide: MusicSchemaCatalog, useClass: MusicSchemaCatalog },
        SongEntitySource,
        SongLocationEntitySource,
    ],
    bootstrap: [MusicAppComponent],
})
export class AppModule {}
