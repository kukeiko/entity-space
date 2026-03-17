import { describe } from "vitest";
import { EntitySchemaCatalog } from "../entity/entity-schema-catalog";
import { AlbumBlueprint, ArtistBlueprint, expectQueries, SongBlueprint } from "../testing";
import { mergeQueries } from "./merge-queries.fn";

describe(mergeQueries, () => {
    const catalog = new EntitySchemaCatalog();
    catalog.addSchemaByBlueprint(ArtistBlueprint);
    catalog.addSchemaByBlueprint(AlbumBlueprint);
    catalog.addSchemaByBlueprint(SongBlueprint);

    expectQueries(catalog, ["artists({ id: 1 })", "artists({ id: 2 })"]).plus().toEqual(["artists({ id: { 1, 2 } })"]);
    expectQueries(catalog, ["artists({ id: 1 })", "artists({ id: 2 })/{ songs }"]).plus().toEqual(false);

    expectQueries(catalog, ["artists({ id: 1 })", "artists({ id: 2 })/{ songs }", "artists({ id: 1 })"])
        .plus()
        .toEqual(["artists({ id: 1 })", "artists({ id: 2 })/{ songs }"]);

    expectQueries(catalog, ["artists({ id: 1 })", "artists({ id: 2 })/{ songs }", "artists({ id: 3 })"])
        .plus()
        .toEqual(["artists({ id: { 1, 3 } })", "artists({ id: 2 })/{ songs }"]);
});
