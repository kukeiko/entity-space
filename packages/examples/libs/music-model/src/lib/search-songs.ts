import { Blueprint, BlueprintInstance, define } from "@entity-space/core";

@Blueprint({ id: "search-songs" })
export class SearchSongsBlueprint {
    searchText = define(String, { required: true });
}

export type SearchSongs = BlueprintInstance<SearchSongsBlueprint>;
