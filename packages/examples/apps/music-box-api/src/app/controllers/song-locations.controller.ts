import { IEntitySchema, Query as EntityQuery, SchemaCatalog } from "@entity-space/core";
import { inSet, matches } from "@entity-space/criteria";
import { SongLocation } from "@entity-space/examples/libs/music-model";
import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { DiskDbService } from "../disk-db.service";
import { ParseIntsPipe } from "../pipes/parse-ints.pipe";

@Controller("song-locations")
export class SongLocationsController {
    constructor(private readonly diskDbService: DiskDbService, private readonly schemaCatalog: SchemaCatalog) {
        this.schema = this.schemaCatalog.getSchema("song-location");
    }

    private readonly schema: IEntitySchema;

    @Get()
    async getSongLocations(
        @Query("id", ParseIntsPipe) id: number[],
        @Query("songId", ParseIntsPipe) songId: number[]
    ): Promise<SongLocation[]> {
        if (id.length > 0) {
            const query = new EntityQuery(this.schema, matches<SongLocation>({ id: inSet(id) }));

            return this.diskDbService.query(query);
        } else if (songId.length > 0) {
            const query = new EntityQuery(this.schema, matches<SongLocation>({ songId: inSet(songId) }));

            return this.diskDbService.query(query);
        } else {
            return this.diskDbService.query(new EntityQuery(this.schema));
        }
    }

    @Post()
    createSongLocation(@Body() songLocation: SongLocation): Promise<SongLocation> {
        return this.diskDbService.createEntity(songLocation, this.schema);
    }
}
