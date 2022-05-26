import { Song } from "@entity-space/examples/libs/music-model";
import { Body, Controller, Get, Param, ParseIntPipe, Post } from "@nestjs/common";
import { DiskDbService } from "./disk-db.service";

@Controller()
export class AppController {
    constructor(private readonly diskDbService: DiskDbService) {}

    @Get("songs")
    getSongs(): Promise<Song[]> {
        return this.diskDbService.getSongs();
    }

    @Get("songs/:id")
    getSong(@Param("id", ParseIntPipe) id: number): Promise<Song | undefined> {
        return this.diskDbService.getSong(id);
    }

    @Post("songs")
    async createSong(@Body() song: Song): Promise<Song> {
        return await this.diskDbService.createSong(song);
    }
}
