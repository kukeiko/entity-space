import { Song } from "@entity-space/examples/libs/music-model";
import { Injectable } from "@nestjs/common";
import { constants } from "fs";
import { access, readFile, writeFile } from "fs/promises";

@Injectable()
export class DiskDbService {
    private readonly songFilePath = "./assets/songs.json";

    async loadSongs(): Promise<Song[]> {
        const filePath = this.songFilePath;

        try {
            await access(filePath, constants.F_OK);
        } catch {
            await writeFile(filePath, "[]");
        }

        const fileContents = await readFile(filePath);
        const songs = JSON.parse(fileContents.toString()) as Song[];

        return songs;
    }

    async createSong(song: Song): Promise<Song> {
        const songs = await this.loadSongs();
        song.id = (songs.sort((a, b) => b.id - a.id)[0]?.id ?? 0) + 1;
        songs.push(song);
        await this.saveSongs(songs);

        return song;
    }

    async saveSongs(songs: Song[]): Promise<void> {
        const filePath = this.songFilePath;

        await writeFile(filePath, JSON.stringify(songs));
    }
}
