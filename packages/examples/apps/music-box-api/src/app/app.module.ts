import { BlueprintResolver, EntitySchema, SchemaCatalog } from "@entity-space/core";
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
        { provide: SchemaCatalog, useClass: SchemaCatalog },
        {
            // [todo] copy pasted from music-box-ui
            provide: BlueprintResolver,
            inject: [SchemaCatalog],
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
    ],
})
export class AppModule {}
