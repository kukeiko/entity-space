import { EntitySchemaCatalog, IEntitySchema, Query as EntityQuery } from "@entity-space/core";
import { Artist, ArtistBlueprint } from "@entity-space/examples/libs/music-model";
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { DiskDbService } from "../disk-db.service";

@Controller("artists")
export class ArtistsController {
    constructor(private readonly diskDbService: DiskDbService, private readonly schemas: EntitySchemaCatalog) {
        this.schema = this.schemas.resolve(ArtistBlueprint);
    }

    private readonly schema: IEntitySchema;

    @Get()
    all(): Promise<Artist[]> {
        return this.diskDbService.query(new EntityQuery(this.schema));
    }

    @Get(":id")
    get(@Param("id", ParseIntPipe) id: number): Promise<Artist | undefined> {
        return this.diskDbService.getSong(id);
    }

    @Post()
    async create(@Body() entity: Artist): Promise<Artist> {
        return await this.diskDbService.createEntity(entity, this.schema);
    }

    @Patch(":id")
    async patch(@Param("id", ParseIntPipe) id: number, @Body() entity: Partial<Artist>): Promise<Artist> {
        return this.diskDbService.patchEntity({ id, ...entity }, this.schema);
    }
}
