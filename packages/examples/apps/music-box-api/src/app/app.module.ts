import { EntitySchema, EntitySchemaCatalog } from "@entity-space/core";
import { SongBlueprint } from "@entity-space/examples/libs/music-model";
import { Module } from "@nestjs/common";
import { ArtistsController } from "./controllers/artists.controller";
import { SongLocationsController } from "./controllers/song-locations.controller";
import { SongsController } from "./controllers/songs.controller";
import { DiskDbService } from "./disk-db.service";

@Module({
    imports: [],
    controllers: [ArtistsController, SongsController, SongLocationsController],
    providers: [
        DiskDbService,
        {
            // [todo] copy pasted from music-box-ui
            provide: EntitySchemaCatalog,
            useFactory: () => {
                const schemas = new EntitySchemaCatalog();

                const songLocationSchema = new EntitySchema("song-location");
                songLocationSchema.setKey("id");
                songLocationSchema.addIndex("songId");
                schemas.addSchema(songLocationSchema);
                songLocationSchema.addProperty("song", schemas.resolve(SongBlueprint));
                songLocationSchema.addRelation("song", "songId", "id");

                return schemas;
            },
        },
    ],
})
export class AppModule {}
