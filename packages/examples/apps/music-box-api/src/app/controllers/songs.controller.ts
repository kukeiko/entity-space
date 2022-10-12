import { EntitySchemaCatalog, IEntitySchema } from "@entity-space/common";
import { Song, SongBlueprint } from "@entity-space/examples/libs/music-model";
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { DiskDbService } from "../disk-db.service";

@Controller("songs")
export class SongsController {
    constructor(private readonly diskDbService: DiskDbService, private readonly schemas: EntitySchemaCatalog) {
        this.schema = this.schemas.resolve(SongBlueprint);
    }

    private readonly schema: IEntitySchema;

    @Get()
    getSongs(@Query("searchText") searchText?: string): Promise<Song[]> {
        return this.diskDbService.getSongs(searchText);
    }

    @Get(":id")
    getSong(@Param("id", ParseIntPipe) id: number): Promise<Song | undefined> {
        return this.diskDbService.getSong(id);
    }

    @Post()
    async createSong(@Body() song: Song): Promise<Song> {
        return await this.diskDbService.createSong(song);
    }

    @Patch(":id")
    async patchSong(@Param("id", ParseIntPipe) id: number, @Body() song: Partial<Song>): Promise<Song> {
        return this.diskDbService.patchEntity({ id, ...song }, this.schema);
    }
}
