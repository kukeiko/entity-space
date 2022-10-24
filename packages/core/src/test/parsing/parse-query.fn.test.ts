import { Query } from "../../lib/query/query";
import { parseQuery } from "../../lib/query/parse-query.fn";
import { EntitySchema, EntitySchemaCatalog, ExpansionValue } from "@entity-space/common";
import { Criterion, isValue, matches, or } from "@entity-space/criteria";
import { QueryPaging } from "../../lib/query/query-paging";

describe("parseQuery()", () => {
    const catalog = new EntitySchemaCatalog();
    const fooSchema = new EntitySchema("foo");
    catalog.addSchema(fooSchema);

    function shouldParse(stringified: string, expected: Query, specFn = it): void {
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

    function fshouldParse(stringified: string, expected: Query): void {
        shouldParse(stringified, expected, fit);
    }

    function xshouldParse(stringified: string, expected: Query): void {
        shouldParse(stringified, expected, xit);
    }

    function createFooQuery({
        options,
        criteria,
        expansion,
        paging,
    }: {
        options?: Criterion;
        criteria?: Criterion;
        expansion?: ExpansionValue;
        paging?: QueryPaging;
    }): Query {
        return new Query({ entitySchema: fooSchema, options, criteria, expansion, paging });
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
        createFooQuery({ expansion: { id: true, name: true, artist: { id: true, name: true } } })
    );
    // schema + options + expansion
    shouldParse(
        'foo<{searchText: "bar"}>/{id,name,artist:{id,name}}',
        createFooQuery({
            options: matches({ searchText: "bar" }),
            expansion: { id: true, name: true, artist: { id: true, name: true } },
        })
    );
    // schema + criteria + expansion
    shouldParse(
        "foo({artistId:7})/{id,name,artist:{id,name}}",
        createFooQuery({
            criteria: matches({ artistId: 7 }),
            expansion: { id: true, name: true, artist: { id: true, name: true } },
        })
    );
    // schema + options + criteria + expansion
    shouldParse(
        'foo<{searchText: "bar"}>({artistId:7})/{id,name,artist:{id,name}}',
        createFooQuery({
            options: matches({ searchText: "bar" }),
            criteria: matches({ artistId: 7 }),
            expansion: { id: true, name: true, artist: { id: true, name: true } },
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
            expansion: { id: true, name: true, artist: { id: true, name: true } },
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
