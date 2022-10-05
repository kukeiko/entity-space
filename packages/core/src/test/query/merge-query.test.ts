import { ExpansionValue } from "@entity-space/common";
import { EntitySchema, mergeQuery, Query } from "@entity-space/core";
import { Criterion, inRange, matches } from "@entity-space/criteria";

function createQuery(criteria: Criterion, expansion: ExpansionValue = {}): Query {
    return new Query({ entitySchema: new EntitySchema("foo"), criteria, expansion });
}
interface Product {
    price: number;
    rating: number;
}

describe("mergeQuery()", () => {
    it(`{ } / { foo } merged with { } / { } should be { } / { foo }`, () => {
        // arrange

        // [todo] need some way to not have to specify a criterion. is it the "always-true" criterion i'm looking for?
        const a = createQuery(
            matches<Product>({
                rating: inRange(3, 5),
            }),
            { foo: true }
        );

        const b = createQuery(
            matches<Product>({
                rating: inRange(3, 5),
            }),
            {}
        );

        const expected = createQuery(
            matches<Product>({
                rating: inRange(3, 5),
            }),
            { foo: true }
        );
        // act
        const actual = mergeQuery(a, b);

        // assert
        expect(actual).toEqual(expected);
    });
    it(`
        { price: [100, 200], rating: [3, 8] } / { foo: true }
        merged with
        { price: [100, 200], rating: [3, 8] } / { bar: true }
        should be
        { price: [100, 200], rating: [3, 8] } / { foo: true, bar: true }`, () => {
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
            { bar: true }
        );

        const expected = createQuery(
            matches<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 5),
            }),
            { foo: true, bar: true }
        );
        // act
        const actual = mergeQuery(a, b);

        // assert
        expect(actual).toEqual(expected);
    });

    it(`
        { price: [100, 200], rating: [3, 8] } / { foo: true }
        merged with
        { price: [100, 200], rating: [3, 8] } / { foo: true }
        should be
        { price: [100, 200], rating: [3, 8] } / { foo: true }`, () => {
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

        const expected = createQuery(
            matches<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 5),
            }),
            { foo: true }
        );
        // act
        const actual = mergeQuery(a, b);

        // assert
        expect(actual).toEqual(expected);
    });
});
