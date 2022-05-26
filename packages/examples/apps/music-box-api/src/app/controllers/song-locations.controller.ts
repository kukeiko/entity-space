import { Query as EntityQuery } from "@entity-space/core";
import { inSet, matches } from "@entity-space/criteria";
import { MusicSchemaCatalog, SongLocation } from "@entity-space/examples/libs/music-model";
import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { DiskDbService } from "../disk-db.service";
import { ParseIntsPipe } from "../pipes/parse-ints.pipe";

@Controller("song-locations")
export class SongLocationsController {
    constructor(
        private readonly diskDbService: DiskDbService,
        private readonly musicSchemaCatalog: MusicSchemaCatalog
    ) {}

    @Get()
    async getSongLocations(
        @Query("id", ParseIntsPipe) id: number[],
        @Query("songId", ParseIntsPipe) songId: number[]
    ): Promise<SongLocation[]> {
        if (id.length > 0) {
            const query = new EntityQuery(
                this.musicSchemaCatalog.getSongLocationSchema(),
                matches<SongLocation>({ id: inSet(id) })
            );

            return this.diskDbService.query(query);
        } else if (songId.length > 0) {
            const query = new EntityQuery(
                this.musicSchemaCatalog.getSongLocationSchema(),
                matches<SongLocation>({ songId: inSet(songId) })
            );

            return this.diskDbService.query(query);
        } else {
            return this.diskDbService.query(new EntityQuery(this.musicSchemaCatalog.getSongLocationSchema()));
        }
    }

    @Post()
    createSongLocation(@Body() songLocation: SongLocation): Promise<SongLocation> {
        return this.diskDbService.createEntity(songLocation, this.musicSchemaCatalog.getSongLocationSchema());
    }
}
