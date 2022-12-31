import { Artist, SongLocationType } from "@entity-space/examples/libs/music-model";

export interface SongFilter {
    artists: Artist[];
    // duration?: [number, number];
    locationTypes: SongLocationType[];
    // paging?: [number, number];
    searchText: string;
}

export function createDefaultSongFilter(): SongFilter {
    return {
        artists: [],
        // duration: [0, 0],
        locationTypes: [],
        // paging: [0, 0],
        searchText: "",
    };
}

export function copySongFilter(filter: SongFilter): SongFilter {
    return {
        artists: filter.artists.slice(),
        // duration: filter.duration ? [...filter.duration] : void 0,
        locationTypes: filter.locationTypes.slice(),
        searchText: filter.searchText,
        // paging: filter.paging ? [...filter.paging] : void 0,
    };
}

export function isSongFilterEmpty(filter: SongFilter): boolean {
    return !filter.artists.length && !filter.locationTypes.length && !filter.searchText.length;
}
