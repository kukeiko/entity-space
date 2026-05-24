import { describe } from "vitest";
import { EntitySchemaCatalog } from "../entity/entity-schema-catalog";
import { AlbumBlueprint, ArtistBlueprint, ArtistRequestBlueprint, expectQuery, SongBlueprint } from "../testing";
import { mergeQuery } from "./merge-query.fn";

describe(mergeQuery, () => {
    const catalog = new EntitySchemaCatalog();
    catalog.addSchemaByBlueprint(ArtistBlueprint);
    catalog.addSchemaByBlueprint(AlbumBlueprint);
    catalog.addSchemaByBlueprint(SongBlueprint);
    catalog.addSchemaByBlueprint(ArtistRequestBlueprint);

    expectQuery(catalog, "artists({ id: 1 })").plus("artists({ id: !1 })").toEqual("artists");
    expectQuery(catalog, "artists").plus("albums").toEqual(false);
    expectQuery(catalog, "artists({ id: 1 })").plus("artists({ id: 2 })").toEqual("artists({ id: { 1, 2 } })");
    expectQuery(catalog, "artists({ id: 1 })")
        .plus(`artists({ name: "foo" })`)
        .toEqual(`artists(({ id: 1 } | { name: "foo" }))`);
    expectQuery(catalog, "artists").plus("artists({ id: 2 })").toEqual("artists");
    expectQuery(catalog, "artists({ id: 2 })").plus("artists").toEqual("artists");
    expectQuery(catalog, "artists({ id: 1 })").plus("artists({ id: 2 })/{ songs }").toEqual(false);
    expectQuery(catalog, `artists<artist-requests:{ "page": 3, "pageSize": 10 }>`)
        .plus(`artists<artist-requests:{ "page": 2, "pageSize": 10 }>`)
        .toEqual(false);
    expectQuery(catalog, "artists[name, 0, 1]").plus("artists[name, 2, 3]").toEqual("artists[name, 0, 3]");
    expectQuery(catalog, "artists[name, 0, 1]").plus("artists[name, 3, 4]").toEqual(false);
    expectQuery(catalog, "artists[name, ..., 3]").plus("artists[name, 1, ...]").toEqual("artists");
    expectQuery(catalog, "artists[name, 0, 1]").plus("artists[!name, 2, 3]").toEqual(false);
    expectQuery(catalog, "artists({ id: 1 })[name, 0, 1]").plus("artists({ id: 2 })[name, 2, 3]").toEqual(false);
    expectQuery(catalog, "artists({ id: { 1 } })[name, 0, 1]")
        .plus("artists({ id: 1 })[name, 2, 3]")
        .toEqual("artists({ id: { 1 } })[name, 0, 3]");
    expectQuery(catalog, "artists[name, 0, 1]/{ title }").plus("artists[name, 2, 3]").toEqual(false);
    expectQuery(catalog, "artists").plus("artists[name, 2, 3]").toEqual("artists");
    expectQuery(catalog, "artists({ id: 1 })").plus("artists[name, 2, 3]").toEqual(false);
    expectQuery(catalog, "artists[name, 2, 3]").plus("artists").toEqual("artists");
    expectQuery(catalog, "artists[name, 2, 3]").plus("artists({ id: 1 })").toEqual(false);
});
