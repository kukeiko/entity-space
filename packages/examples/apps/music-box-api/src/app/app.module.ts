import { MusicSchemaCatalog } from "@entity-space/examples/libs/music-model";
import { Module } from "@nestjs/common";
import { ArtistsController } from "./controllers/artists.controller";
import { SongLocationsController } from "./controllers/song-locations.controller";
import { SongsController } from "./controllers/songs.controller";
import { DiskDbService } from "./disk-db.service";

@Module({
    imports: [],
    controllers: [ArtistsController, SongsController, SongLocationsController],
    providers: [DiskDbService, { provide: MusicSchemaCatalog, useClass: MusicSchemaCatalog }],
})
export class AppModule {}
