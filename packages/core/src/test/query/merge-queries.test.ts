import { ExpansionValue } from "@entity-space/common";
import { EntitySchema, mergeQueries, Query } from "@entity-space/core";
import { Criterion, inRange, matches, or } from "@entity-space/criteria";

function createQuery(criteria: Criterion, expansion: ExpansionValue = {}): Query {
    return new Query({ entitySchema: new EntitySchema("foo"), criteria, expansion });
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
        const firstMerge = mergeQueries(a, b);
        const secondMerge = mergeQueries(...firstMerge, c);

        // assert
        expect(secondMerge).toEqual(expected);
    });
});
