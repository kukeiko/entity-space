import { IsExact } from "conditional-type-checks";
import { Select } from "../../index";

interface Song {
    id: number;
    name: string;
    artist?: Artist;
    duration?: number | null;
    album?: Album;
    locations?: SongLocation[];
    tags?: string[];
    isFavorite?: boolean;
}

interface WebSongLocation {
    id: number;
    url?: string;
    type: "web";
}

interface LocalSongLocation {
    id: number;
    path?: string;
    type: "local";
}

type SongLocation = WebSongLocation | LocalSongLocation;

interface Album {
    id: number;
    name: string;
    songs?: Song[];
}

interface Artist {
    id: number;
    name: string;
}

// $ExpectType true
type Artist_IsUndefined_BeforeExpand = IsExact<Song["artist"], Artist | undefined>;

// $ExpectType true
type Artist_IsDefined_AfterExpand = IsExact<Select<Song, { artist: true }>["artist"], Artist>;

// $ExpectType true
type Duration_IsUndefinedOrNull_BeforeExpand = IsExact<Song["duration"], number | undefined | null>;

// $ExpectType true
type Duration_KeepsBeingNull_AfterExpand = IsExact<Select<Song, { duration: true }>["duration"], number | null>;

// $ExpectType true
type CanExpandDeeply = IsExact<
    Select<Song, { album: { songs: { artist: true } } }>,
    // [todo] using Array<...> notation only because TSlint complained
    Song & { album: Album & { songs: Array<Song & { artist: Artist }> } }
>;

// $ExpectType true
type CanExpandAcrossUnions = IsExact<
    Select<Song, { locations: { url: true; path: true } }>,
    Song & {
        // [todo] using Array<...> notation only because TSlint complained
        locations: Array<(WebSongLocation & { url: string }) | (LocalSongLocation & { path: string })>;
    }
>;

// $ExpectType true
type CanExpandArrayOfPrimitives = IsExact<Select<Song, { tags: true }>, Song & { tags: string[] }>;

// $ExpectType true
type CanExpandBooleans = IsExact<Select<Song, { isFavorite: true }>, Song & { isFavorite: boolean }>;
