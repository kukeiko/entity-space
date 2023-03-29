import { EntityBlueprint, EntityBlueprintInstance, define } from "@entity-space/core";

@EntityBlueprint({ id: "search-songs" })
export class SearchSongsBlueprint {
    searchText = define(String, { required: true });
}

export type SearchSongs = EntityBlueprintInstance<SearchSongsBlueprint>;
