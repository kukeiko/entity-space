import { MusicSchemaCatalog } from "@entity-space/examples/libs/music-model";
import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SongLocationsController } from "./controllers/song-locations.controller";
import { DiskDbService } from "./disk-db.service";

@Module({
    imports: [],
    controllers: [AppController, SongLocationsController],
    providers: [AppService, DiskDbService, { provide: MusicSchemaCatalog, useClass: MusicSchemaCatalog }],
})
export class AppModule {}
