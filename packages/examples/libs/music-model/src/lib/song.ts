import { Artist } from "./artist";
import { SongLocation } from "./song-location";

export interface Song {
    id: number;
    name: string;
    duration: number;
    artistId: number;
    artist?: Artist;
    locations?: SongLocation[];
}
