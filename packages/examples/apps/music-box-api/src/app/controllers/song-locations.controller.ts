import { EntityCriteriaTools, EntityQueryTools, EntitySchemaCatalog, IEntitySchema } from "@entity-space/core";
import { SongLocation } from "@entity-space/examples/libs/music-model";
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { DiskDbService } from "../disk-db.service";
import { ParseIntsPipe } from "../pipes/parse-ints.pipe";

@Controller("song-locations")
export class SongLocationsController {
    constructor(private readonly diskDbService: DiskDbService, private readonly schemaCatalog: EntitySchemaCatalog) {
        this.schema = this.schemaCatalog.getSchema("song-location");
    }

    private readonly schema: IEntitySchema;
    private readonly criteriaTools = new EntityCriteriaTools();
    private readonly queryTools = new EntityQueryTools({ criteriaTools: this.criteriaTools });

    @Get()
    async getSongLocations(
        @Query("id", ParseIntsPipe) id: number[],
        @Query("songId", ParseIntsPipe) songId: number[]
    ): Promise<SongLocation[]> {
        const { createQuery } = this.queryTools;
        const { where, inArray } = this.criteriaTools;

        if (id.length > 0) {
            const query = createQuery({
                entitySchema: this.schema,
                criteria: where<SongLocation>({
                    id: inArray(id),
                }),
            });

            return this.diskDbService.query(query);
        } else if (songId.length > 0) {
            const query = createQuery({
                entitySchema: this.schema,
                criteria: where<SongLocation>({
                    songId: inArray(songId),
                }),
            });

            return this.diskDbService.query(query);
        } else {
            return this.diskDbService.query(createQuery({ entitySchema: this.schema }));
        }
    }

    @Patch(":id")
    update(@Param("id", ParseIntPipe) id: number, @Body() songLocation: Partial<SongLocation>): Promise<SongLocation> {
        // [todo] cast to any
        return this.diskDbService.patchEntity({ id, ...(songLocation as any) }, this.schema);
    }

    @Post()
    createSongLocation(@Body() songLocation: SongLocation): Promise<SongLocation> {
        return this.diskDbService.createEntity(songLocation, this.schema);
    }
}
