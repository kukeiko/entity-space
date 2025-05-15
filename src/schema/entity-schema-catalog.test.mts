import { describe, it } from "vitest";
import { EntitySchemaCatalog } from "./entity-schema-catalog.mjs";
import { ArtistBlueprint } from "./testing/artist.model.mjs";
import { SongBlueprint } from "./testing/song.model.mjs";

describe(EntitySchemaCatalog, () => {
    it("should work", () => {
        const catalog = new EntitySchemaCatalog();
        const artistSchema = catalog.getSchemaByBlueprint(ArtistBlueprint);
        const songSchema = catalog.getSchemaByBlueprint(SongBlueprint);

        console.log(artistSchema);
    });
});
