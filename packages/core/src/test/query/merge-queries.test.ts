import { EntitySchema, EntitySchemaCatalog, UnpackedEntitySelection } from "@entity-space/common";
import { Criterion } from "../../lib/criteria/criterion/criterion";
import { matches } from "../../lib/criteria/criterion/named/matches.fn";
import { or } from "../../lib/criteria/criterion/or/or.fn";
import { inRange } from "../../lib/criteria/criterion/range/in-range.fn";
import { EntityQuery } from "../../lib/query/entity-query";
import { mergeQueries } from "../../lib/query/merge-queries.fn";
import { mergeQuery } from "../../lib/query/merge-query.fn";
import { parseQuery } from "../../lib/query/parse-query.fn";

function createQuery(criteria: Criterion, selection: UnpackedEntitySelection = {}): EntityQuery {
    return new EntityQuery({ entitySchema: new EntitySchema("user"), criteria, selection });
}

interface Product {
    price: number;
    rating: number;
}

describe("mergeQueries()", () => {
    it(`
        { price: [100, 200], rating: [3, 5] }
        merged with
        { price: [300, 500], rating: [3, 5] }
        should be
        ({ price: [100, 200], rating: [3, 5] } | { price: [300, 500], rating: [3, 5] })`, () => {
        // arrange
        const a = createQuery(
            matches<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 5),
            })
        );

        const b = createQuery(
            matches<Product>({
                price: inRange(300, 500),
                rating: inRange(3, 5),
            })
        );

        const expected = [
            createQuery(
                or(
                    matches<Product>({
                        price: inRange(100, 200),
                        rating: inRange(3, 5),
                    }),
                    matches<Product>({
                        price: inRange(300, 500),
                        rating: inRange(3, 5),
                    })
                )
            ),
        ];

        // act
        const actual = mergeQueries(a, b);

        // assert
        expect(actual).toEqual(expected);
    });

    it(`
        { price: [100, 200], rating: [3, 8] } / { foo }
        merged with
        { price: [100, 200], rating: [3, 8] } / { foo }
        should be
        { price: [100, 200], rating: [3, 8] } / { foo }`, () => {
        // arrange
        const a = createQuery(
            matches<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 5),
            }),
            { foo: true }
        );

        const b = createQuery(
            matches<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 5),
            }),
            { foo: true }
        );

        const expected = [
            createQuery(
                matches<Product>({
                    price: inRange(100, 200),
                    rating: inRange(3, 5),
                }),
                { foo: true }
            ),
        ];

        // act
        const actual = mergeQueries(a, b);

        // assert
        expect(actual).toEqual(expected);
    });

    // [todo] excluded until #144 is done. as a workaround, workspace.ts merges twice.
    it(`merging [
            { price: [100, 200], rating: [3, 5] } / { foo },
            { price: [100, 200], rating: [3, 8] } / { },
            { price: [100, 200], rating: [3, 8] } / { foo }
        ]
        should be
        { price: [100, 200], rating: [3, 8] } / { foo }`, () => {
        // arrange
        const a = createQuery(
            matches<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 5),
            }),
            { foo: true }
        );

        const b = createQuery(
            matches<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 8),
            }),
            {}
        );

        const c = createQuery(
            matches<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 8),
            }),
            { foo: true }
        );

        const expected = [
            createQuery(
                matches<Product>({
                    price: inRange(100, 200),
                    rating: inRange(3, 8),
                }),
                { foo: true }
            ),
        ];

        // act
        const actual = mergeQueries(a, b, c);

        // assert
        expect(actual).toEqual(expected);
    });

    it("should merge A, B & C where A can only be merged after B & C have been merged", () => {
        const schemas = new EntitySchemaCatalog();
        const userSchema = new EntitySchema("users");
        userSchema.addRelationProperty("parent", userSchema, "parentId", "id");
        schemas.addSchema(userSchema);

        const A = parseQuery("users({ id: {2, 3}, parent: { id: 7 } })/{ id, parentId }", schemas);
        const B = parseQuery("users({ id: 2, parent: { id: 7 } })/{ id, parentId, parent: { id } }", schemas);
        const C = parseQuery("users({ id: 3, parent: { id: 7 } })/{ id, parentId, parent: { id } }", schemas);
        const expected = "users({ id: {2, 3}, parent: { id: 7 } })/{ id, parentId, parent: { id } }";

        expect(mergeQuery(A, B)).toBe(false);
        expect(mergeQuery(A, C)).toBe(false);
        const BC = mergeQuery(B, C);
        expect(BC).not.toBe(false);
        expect(BC.toString()).toEqual(expected);

        expect(mergeQuery(A, BC as EntityQuery).toString()).toEqual(expected);

        expect(mergeQueries(A, B, C).toString()).toEqual(expected);
    });
});
