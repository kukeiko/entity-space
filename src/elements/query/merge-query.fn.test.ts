import { describe } from "vitest";
import { EntitySchemaCatalog } from "../entity/entity-schema-catalog";
import { AlbumBlueprint, ArtistBlueprint, expectQuery, SongBlueprint } from "../testing";
import { mergeQuery } from "./merge-query.fn";

describe(mergeQuery, () => {
    const catalog = new EntitySchemaCatalog();
    catalog.addSchemaByBlueprint(ArtistBlueprint);
    catalog.addSchemaByBlueprint(AlbumBlueprint);
    catalog.addSchemaByBlueprint(SongBlueprint);

    expectQuery(catalog, "artists({ id: 1 })").plus("artists({ id: 2 })").toEqual("artists({ id: { 1, 2 } })");
    expectQuery(catalog, "artists({ id: 1 })")
        .plus(`artists({ name: "foo" })`)
        .toEqual(`artists(({ id: 1 } | { name: "foo" }))`);
    expectQuery(catalog, "artists").plus("artists({ id: 2 })").toEqual("artists");
    expectQuery(catalog, "artists({ id: 1 })").plus("artists({ id: 2 })/{ songs }").toEqual(false);
});
