import { EntitySchema } from "../../lib/schema/entity-schema";
import { EntitySchemaCatalog } from "../../lib/schema/entity-schema-catalog";
import { UnpackedEntitySelection } from "../../lib/common/unpacked-entity-selection.type";
import { Criterion } from "../../lib/criteria/criterion/criterion";
import { matches } from "../../lib/criteria/criterion/named/matches.fn";
import { or } from "../../lib/criteria/criterion/or/or.fn";
import { isValue } from "../../lib/criteria/criterion/value/is-value.fn";
import { EntityQuery } from "../../lib/query/entity-query";
import { parseQuery } from "../../lib/query/parse-query.fn";
import { QueryPaging } from "../../lib/query/query-paging";

describe("parseQuery()", () => {
    const catalog = new EntitySchemaCatalog();
    const fooSchema = new EntitySchema("foo");
    catalog.addSchema(fooSchema);

    function shouldParse(stringified: string, expected: EntityQuery, specFn = it): void {
        specFn(`should parse ${stringified} to ${expected.toString()}`, () => {
            const parse = () => parseQuery(stringified, catalog);
            expect(parse).not.toThrow();
            expect(parse()).toEqual(expected);
        });
    }

    function shouldNotParse(stringified: string, specFn = it): void {
        specFn(`should not parse ${stringified}`, () => {
            const parse = () => parseQuery(stringified, catalog);
            expect(parse).toThrow();
        });
    }

    function fshouldParse(stringified: string, expected: EntityQuery): void {
        shouldParse(stringified, expected, fit);
    }

    function xshouldParse(stringified: string, expected: EntityQuery): void {
        shouldParse(stringified, expected, xit);
    }

    function createFooQuery({
        options,
        criteria,
        selection,
        paging,
    }: {
        options?: Criterion;
        criteria?: Criterion;
        selection?: UnpackedEntitySelection;
        paging?: QueryPaging;
    }): EntityQuery {
        return new EntityQuery({ entitySchema: fooSchema, options, criteria, selection, paging });
    }

    // schema only
    shouldParse("foo", createFooQuery({}));
    // schema + options
    shouldParse('foo<{searchText: "bar"}>', createFooQuery({ options: matches({ searchText: "bar" }) }));
    // schema + criteria
    shouldParse("foo({artistId:7})", createFooQuery({ criteria: matches({ artistId: 7 }) }));
    shouldParse("foo({artistId:7} | true)", createFooQuery({ criteria: or(matches({ artistId: 7 }), isValue(true)) }));
    // schema + options + criteria
    shouldParse(
        'foo<{searchText: "bar"}>({artistId:7})',
        createFooQuery({ options: matches({ searchText: "bar" }), criteria: matches({ artistId: 7 }) })
    );
    // schema + expansion
    shouldParse(
        "foo/{id,name,artist:{id,name}}",
        createFooQuery({ selection: { id: true, name: true, artist: { id: true, name: true } } })
    );
    // schema + options + expansion
    shouldParse(
        'foo<{searchText: "bar"}>/{id,name,artist:{id,name}}',
        createFooQuery({
            options: matches({ searchText: "bar" }),
            selection: { id: true, name: true, artist: { id: true, name: true } },
        })
    );
    // schema + criteria + expansion
    shouldParse(
        "foo({artistId:7})/{id,name,artist:{id,name}}",
        createFooQuery({
            criteria: matches({ artistId: 7 }),
            selection: { id: true, name: true, artist: { id: true, name: true } },
        })
    );
    // schema + options + criteria + expansion
    shouldParse(
        'foo<{searchText: "bar"}>({artistId:7})/{id,name,artist:{id,name}}',
        createFooQuery({
            options: matches({ searchText: "bar" }),
            criteria: matches({ artistId: 7 }),
            selection: { id: true, name: true, artist: { id: true, name: true } },
        })
    );
    // schema + paging
    shouldParse(`foo[0,7]`, createFooQuery({ paging: new QueryPaging({ sort: [], from: 0, to: 7 }) }));

    // schema + paging & sorting
    shouldParse(
        `foo[name,0,7]`,
        createFooQuery({ paging: new QueryPaging({ sort: [{ field: "name", mode: "asc" }], from: 0, to: 7 }) })
    );

    // schema + paging & multi-sorting
    shouldParse(
        `foo[name,!createdAt,0,7]`,
        createFooQuery({
            paging: new QueryPaging({
                sort: [
                    { field: "name", mode: "asc" },
                    { field: "createdAt", mode: "desc" },
                ],
                from: 0,
                to: 7,
            }),
        })
    );

    // schema + options + criteria + paging & multi-sorting + expansion
    shouldParse(
        `foo<{searchText: "bar"}>({artistId: 7})[name,!artist.name,0,7]/{id,name,artist:{id,name}}`,
        createFooQuery({
            options: matches({ searchText: "bar" }),
            criteria: matches({ artistId: 7 }),
            selection: { id: true, name: true, artist: { id: true, name: true } },
            paging: new QueryPaging({
                sort: [
                    { field: "name", mode: "asc" },
                    { field: "artist.name", mode: "desc" },
                ],
                from: 0,
                to: 7,
            }),
        })
    );

    shouldNotParse('foo<{searchText: "bar"}');
    shouldNotParse("foo<>");
    shouldNotParse("foo()");
    shouldNotParse("foo/");
    shouldNotParse("foo[0,7");
});
