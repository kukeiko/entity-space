import { Song } from "@entity-space/examples/libs/music-model";
import { Body, Controller, Get, Post } from "@nestjs/common";
import { AppService } from "./app.service";
import { DiskDbService } from "./disk-db.service";

@Controller()
export class AppController {
    constructor(private readonly appService: AppService, private readonly diskDbService: DiskDbService) {}

    @Get()
    getData() {
        return this.appService.getData();
    }

    @Get("songs")
    getSongs(): Promise<Song[]> {
        return this.diskDbService.loadSongs();
    }

    @Post("songs")
    async createSong(@Body() song: Song): Promise<Song> {
        return await this.diskDbService.createSong(song);
    }
}
