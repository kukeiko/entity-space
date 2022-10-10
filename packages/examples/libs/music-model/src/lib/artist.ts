import { Blueprint, define, BlueprintInstance } from "@entity-space/common";

@Blueprint({ id: "artist" })
export class ArtistBlueprint {
    id = define(Number, { id: true, required: true });
    name = define(String, { required: true });
}

export type Artist = BlueprintInstance<ArtistBlueprint>;
