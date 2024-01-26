import { EntityBlueprint } from "packages/core/src/lib/schema/entity-blueprint";
import { EntityBlueprintInstance } from "packages/core/src/lib/schema/entity-blueprint-instance.type";
import { define } from "packages/core/src/lib/schema/entity-blueprint-property";

@EntityBlueprint({ id: "artists" })
export class ArtistBlueprint {
    id = define(Number, { id: true });
    name = define(String);
}

export type Artist = EntityBlueprintInstance<ArtistBlueprint>;
