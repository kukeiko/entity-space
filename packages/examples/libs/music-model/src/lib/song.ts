import { SongLocation } from "./song-location";

export interface Song {
    id: number;
    name: string;
    locations?: SongLocation[];
}
