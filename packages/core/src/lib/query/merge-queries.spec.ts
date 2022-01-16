import { Criterion, inRange, matches, or } from "../criteria/public";
import { Expansion } from "../expansion/public";
import { EntitySchema } from "../schema/public";
import { mergeQueries } from "./merge-queries.fn";
import { Query } from "./query";

function createQuery(criteria: Criterion, expansion: Expansion = {}): Query {
    return { entitySchema: new EntitySchema("foo"), criteria, expansion };
}

interface Product {
    price: number;
    rating: number;
}

describe("mergeQuery()", () => {
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
});
