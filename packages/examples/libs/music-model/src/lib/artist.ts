import { Blueprint, define, Instance } from "@entity-space/core";

@Blueprint({ id: "artist" })
export class ArtistBlueprint {
    id = define(Number, { id: true, required: true });
    name = define(String, { required: true });
}

export type Artist = Instance<ArtistBlueprint>;
