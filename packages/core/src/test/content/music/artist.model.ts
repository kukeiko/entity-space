import { EntityBlueprintInstance } from "../../../lib/schema/entity-blueprint-instance.type";
import { EntityBlueprint } from "../../../lib/schema/entity-blueprint";
import { define } from "../../../lib/schema/entity-blueprint-property";
import { SongBlueprint } from "./song.model";

@EntityBlueprint({ id: "artists" })
export class ArtistBlueprint {
    id = define(Number, { id: true });
    name = define(String);
    country = define(String);
    title = define(String, { optional: true });
    songs = define(SongBlueprint, { relation: true, optional: true, array: true, from: "id", to: "artistId" });
    longestSong = define(SongBlueprint, { optional: true });
}

export type Artist = EntityBlueprintInstance<ArtistBlueprint>;
