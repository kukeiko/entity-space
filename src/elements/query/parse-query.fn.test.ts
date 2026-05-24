import { Primitive, toPath } from "@entity-space/utils";
import { describe, expect, it, TestAPI } from "vitest";
import { Criterion } from "../criteria/criterion";
import { EntityCriterion, PackedEntityCriterion } from "../criteria/entity-criterion";
import { EqualsCriterion } from "../criteria/equals-criterion";
import { OrCriterion } from "../criteria/or-criterion";
import { EntitySchemaCatalog } from "../entity/entity-schema-catalog";
import { EntityPropertySort, EntitySort, EntitySortDirection } from "../entity/entity-sort";
import { PackedEntitySelection } from "../selection/entity-selection";
import { unpackSelection } from "../selection/unpack-selection.fn";
import { Artist, ArtistBlueprint, ArtistRequest, ArtistRequestBlueprint } from "../testing";
import { EntityPage } from "./entity-page";
import { EntityQuery } from "./entity-query";
import { EntityQueryParameters } from "./entity-query-parameters";
import { parseQuery } from "./parse-query.fn";

describe(parseQuery, () => {
    const catalog = new EntitySchemaCatalog();
    const artistSchema = catalog.getSchemaByBlueprint(ArtistBlueprint);
    const artistRequestSchema = catalog.getSchemaByBlueprint(ArtistRequestBlueprint);

    function shouldParse(stringified: string, expected: EntityQuery, specFn: TestAPI | TestAPI["skip"] = it): void {
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

    function createArtistQuery(
        selection?: PackedEntitySelection<Artist>,
        criterion?: Criterion,
        parameters?: ArtistRequest,
        sort?: EntitySort,
        page?: EntityPage,
    ): EntityQuery {
        return new EntityQuery(
            artistSchema,
            unpackSelection(artistSchema, selection ?? {}),
            criterion,
            parameters ? new EntityQueryParameters(artistRequestSchema, parameters) : undefined,
            sort,
            page,
        );
    }

    const where = (criteria: PackedEntityCriterion<Artist>) => new EntityCriterion(criteria);
    const or = (criteria: Criterion[]) => new OrCriterion(criteria);
    const equals = (value: ReturnType<Primitive>) => new EqualsCriterion(value);

    // schema only
    shouldParse("artists", createArtistQuery());
    // schema + criteria
    shouldParse("artists({ id: 7 })", createArtistQuery(undefined, where({ id: 7 })));
    shouldParse("artists({ id: 7 } | true)", createArtistQuery(undefined, or([where({ id: 7 }), equals(true)])));
    // schema + selection
    shouldParse(
        "artists/{ id, name, songs: { id, name } }",
        createArtistQuery({ id: true, name: true, songs: { id: true, name: true } }),
    );
    // schema + criteria + selection
    shouldParse(
        "artists({ id: 7 })/{ id, name, songs: { id, name } }",
        createArtistQuery({ id: true, name: true, songs: { id: true, name: true } }, where({ id: 7 })),
    );

    // schema + parameters
    shouldParse(
        `artists<artist-requests:{ "page": 3, "pageSize": 10 }>`,
        createArtistQuery(undefined, undefined, { page: 3, pageSize: 10 }),
    );

    // schema + parameters + criterion
    shouldParse(
        `artists<artist-requests:{ "page": 3, "pageSize": 10 }>({ id: 7 })`,
        createArtistQuery(undefined, where({ id: 7 }), { page: 3, pageSize: 10 }),
    );

    // schema + parameters + criterion + selection
    shouldParse(
        `artists<artist-requests:{ "page": 3, "pageSize": 10 }>({ id: 7 })/{ id, name, songs: { id, name } }`,
        createArtistQuery({ id: true, name: true, songs: { id: true, name: true } }, where({ id: 7 }), {
            page: 3,
            pageSize: 10,
        }),
    );

    // shema + sort
    shouldParse(
        `artists[name]`,
        createArtistQuery(
            undefined,
            undefined,
            undefined,
            new EntitySort([new EntityPropertySort(toPath("name"), EntitySortDirection.Ascending)]),
        ),
    );

    // schema + parameters + criterion + selection + paging
    shouldParse(
        `artists<artist-requests:{ "page": 3, "pageSize": 10 }>({ id: 7 })[name, !title, 5, 10]/{ id, name, songs: { id, name } }`,
        createArtistQuery(
            { id: true, name: true, songs: { id: true, name: true } },
            where({ id: 7 }),
            {
                page: 3,
                pageSize: 10,
            },
            new EntitySort([
                new EntityPropertySort(toPath("name"), EntitySortDirection.Ascending),
                new EntityPropertySort(toPath("title"), EntitySortDirection.Descending),
            ]),
            new EntityPage(5, 10),
        ),
    );

    // invalid
    shouldNotParse('artists<{searchText: "bar"}');
    shouldNotParse("artists<>");
    shouldNotParse("artists()");
    shouldNotParse("artists/");
    shouldNotParse("artists[0,7");
    shouldNotParse("artist");
});
