import { describe } from "vitest";
import { EntitySchemaCatalog } from "../entity/entity-schema-catalog";
import { AlbumBlueprint, ArtistBlueprint, ArtistRequestBlueprint, expectQuery, SongBlueprint } from "../testing";
import { subtractQuery } from "./subtract-query.fn";

describe(subtractQuery, () => {
    const catalog = new EntitySchemaCatalog();
    catalog.addSchemaByBlueprint(ArtistBlueprint);
    catalog.addSchemaByBlueprint(AlbumBlueprint);
    catalog.addSchemaByBlueprint(SongBlueprint);
    catalog.addSchemaByBlueprint(ArtistRequestBlueprint);

    expectQuery(catalog, "artists({ id: 1 })").minus("artists({ id: 1 })").toEqual(true);
    expectQuery(catalog, "artists/{ country }").minus("artists").toEqual("artists/{ country }");
    expectQuery(catalog, "artists({ id: 1 })/{ title, country }")
        .minus("artists({ id: 1 })/{ title }")
        .toEqual("artists({ id: 1 })/{ country }");
    expectQuery(catalog, "artists({ id: { 1, 2 } })").minus("artists({ id: 1 })").toEqual("artists({ id: { 2 } })");
    expectQuery(catalog, "artists({ id: 1 })[name, 0, 10]")
        .minus("artists({ id: 1 })[name, 5, 10]")
        .toEqual("artists({ id: 1 })[name, 0, 4]");
    expectQuery(catalog, "artists({ id: 1 })[name, 5, 10]")
        .minus("artists({ id: 1 })[name, 0, 7]")
        .toEqual("artists({ id: 1 })[name, 8, 10]");
    expectQuery(catalog, "artists({ id: 1 })").minus("artists({ id: 1 })[name, 0, 7]").toEqual(false);
    expectQuery(catalog, "artists({ id: 1 })[name, 0, 10]").minus("artists({ id: 1 })[name, 1, 2]").toEqual(false);
    expectQuery(catalog, "artists({ id: 1 })[name, 0, 7]").minus("artists({ id: 2 })").toEqual(false);
    expectQuery(catalog, "artists({ id: 1 })[name, 0, 10]").minus("artists({ id: 1 })[!name, 5, 10]").toEqual(false);
    expectQuery(catalog, "artists({ id: 1 })[name, 0, 10]").minus("artists({ id: 1 })[name, 11, 20]").toEqual(false);
    expectQuery(catalog, "artists({ id: 1 })[name, 1, 9]").minus("artists({ id: 1 })[name, 0, 10]").toEqual(true);
    expectQuery(catalog, "artists({ id: 1 })[name, 0, 4]").minus("artists").toEqual(true);
    expectQuery(catalog, "artists({ id: 1 })[name, 0, 4]/{ country }").minus("artists").toEqual(false);
    expectQuery(catalog, "artists({ id: 1 })[name, 0, 4]").minus("artists({ id: { 1, 2 } })").toEqual(true);
    expectQuery(catalog, "artists({ id: 1 })[name, 0, 4]")
        .minus("artists({ id: { 1, 2 } })[name, 0, 4]")
        .toEqual(false);
});
