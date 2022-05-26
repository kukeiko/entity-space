export interface BaseSongLocation {
    id: number;
    songId: number;
}

export interface WebSongLocation extends BaseSongLocation {
    url: string;
    songLocationType: "web";
}

export interface LocalSongLocation extends BaseSongLocation {
    path: string;
    songLocationType: "local";
}

export type SongLocation = LocalSongLocation | WebSongLocation;
