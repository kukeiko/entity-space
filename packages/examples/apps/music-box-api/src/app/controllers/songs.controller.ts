import { MusicSchemaCatalog, Song } from "@entity-space/examples/libs/music-model";
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { DiskDbService } from "../disk-db.service";

@Controller("songs")
export class SongsController {
    constructor(
        private readonly diskDbService: DiskDbService,
        private readonly musicSchemaCatalog: MusicSchemaCatalog
    ) {}

    @Get()
    getSongs(): Promise<Song[]> {
        return this.diskDbService.getSongs();
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
        return this.diskDbService.patchEntity({ id, ...song }, this.musicSchemaCatalog.getSongSchema());
    }
}
