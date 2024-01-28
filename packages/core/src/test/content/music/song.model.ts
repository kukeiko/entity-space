import { EntityBlueprintInstance } from "../../../lib/schema/entity-blueprint-instance.type";
import { EntityBlueprint } from "../../../lib/schema/entity-blueprint";
import { define } from "../../../lib/schema/entity-blueprint-property";
import { ArtistBlueprint } from "./artist.model";

@EntityBlueprint({ id: "songs" })
export class SongBlueprint {
    id = define(Number, { id: true });
    name = define(String);
    artistId = define(Number);
    artist = define(ArtistBlueprint, { relation: true, optional: true, from: "artistId", to: "id" });
    duration = define(Number);
}

export type Song = EntityBlueprintInstance<SongBlueprint>;
