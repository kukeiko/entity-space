import { EntityBlueprint, EntityBlueprintInstance, define } from "@entity-space/core";

@EntityBlueprint({ id: "artist" })
export class ArtistBlueprint {
    id = define(Number, { id: true, required: true });
    name = define(String, { required: true });
}

export type Artist = EntityBlueprintInstance<ArtistBlueprint>;
