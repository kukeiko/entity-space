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
    async getSongs(
        @Query("searchText") searchText?: string,
        @Query("skip") skip?: string,
        @Query("top") top?: string
    ): Promise<Song[]> {
        let songs = await this.diskDbService.getSongs(searchText);

        if (skip || top) {
            const parsedSkip = parseInt(skip || "0");
            const parsedTop = top ? parseInt(top) : void 0;

            if (!isNaN(parsedSkip) && (parsedTop === void 0 || !isNaN(parsedTop))) {
                return songs.slice(parsedSkip, parsedTop);
            }
        }

        return songs;
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
