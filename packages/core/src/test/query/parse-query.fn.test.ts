import { UnpackedEntitySelection } from "../../lib/common/unpacked-entity-selection.type";
import { ICriterion } from "../../lib/criteria/vnext/criterion.interface";
import { EntityCriteriaTools } from "../../lib/criteria/vnext/entity-criteria-tools";
import { EntityQuery } from "../../lib/query/entity-query";
import { EntityQueryTools } from "../../lib/query/entity-query-tools";
import { IEntityQuery } from "../../lib/query/entity-query.interface";
import { QueryPaging } from "../../lib/query/query-paging";
import { EntitySchema } from "../../lib/schema/entity-schema";
import { EntitySchemaCatalog } from "../../lib/schema/entity-schema-catalog";

describe("parseQuery()", () => {
    const catalog = new EntitySchemaCatalog();
    const fooSchema = new EntitySchema("foo");
    catalog.addSchema(fooSchema);
    const criteriaFactory = new EntityCriteriaTools();
    const queryTools = new EntityQueryTools({ criteriaFactory });
    const { parseQuery } = queryTools;

    function shouldParse(stringified: string, expected: IEntityQuery, specFn = it): void {
        specFn(`should parse ${stringified} to ${expected.toString()}`, () => {
            const parse = () => parseQuery(stringified, catalog);
            expect(parse).not.toThrow();
            expect(parse().toString()).toEqual(expected.toString());
        });
    }

    function shouldNotParse(stringified: string, specFn = it): void {
        specFn(`should not parse ${stringified}`, () => {
            const parse = () => parseQuery(stringified, catalog);
            expect(parse).toThrow();
        });
    }

    function createFooQuery({
        options,
        criteria,
        selection,
        paging,
    }: {
        options?: ICriterion;
        criteria?: ICriterion;
        selection?: UnpackedEntitySelection;
        paging?: QueryPaging;
    }): IEntityQuery {
        return queryTools.createQuery({ entitySchema: fooSchema, options, criteria, selection, paging });
    }

    const { where, or, equals } = criteriaFactory;

    // schema only
    shouldParse("foo", createFooQuery({}));
    // schema + options
    shouldParse('foo<{searchText: "bar"}>', createFooQuery({ options: where({ searchText: "bar" }) }));
    // schema + criteria
    shouldParse("foo({artistId:7})", createFooQuery({ criteria: where({ artistId: 7 }) }));
    shouldParse("foo({artistId:7} | true)", createFooQuery({ criteria: or([where({ artistId: 7 }), equals(true)]) }));
    // schema + options + criteria
    shouldParse(
        'foo<{searchText: "bar"}>({artistId:7})',
        createFooQuery({ options: where({ searchText: "bar" }), criteria: where({ artistId: 7 }) })
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
            options: where({ searchText: "bar" }),
            selection: { id: true, name: true, artist: { id: true, name: true } },
        })
    );
    // schema + criteria + expansion
    shouldParse(
        "foo({artistId:7})/{id,name,artist:{id,name}}",
        createFooQuery({
            criteria: where({ artistId: 7 }),
            selection: { id: true, name: true, artist: { id: true, name: true } },
        })
    );
    // schema + options + criteria + expansion
    shouldParse(
        'foo<{searchText: "bar"}>({artistId:7})/{id,name,artist:{id,name}}',
        createFooQuery({
            options: where({ searchText: "bar" }),
            criteria: where({ artistId: 7 }),
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
            options: where({ searchText: "bar" }),
            criteria: where({ artistId: 7 }),
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
