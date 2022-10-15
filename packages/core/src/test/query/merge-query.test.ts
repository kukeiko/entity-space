import { EntitySchema, ExpansionValue } from "@entity-space/common";
import { mergeQuery, Query } from "@entity-space/core";
import { Criterion, inRange, matches } from "@entity-space/criteria";
import { QueryPaging } from "../../lib/query/query-paging";

function createQuery({
    criteria,
    expansion = {},
    paging,
}: {
    criteria: Criterion;
    expansion?: ExpansionValue;
    paging?: QueryPaging;
}): Query {
    return new Query({ entitySchema: new EntitySchema("foo"), criteria, expansion, paging });
}
interface Product {
    price: number;
    rating: number;
}

describe("mergeQuery()", () => {
    it(`{ } / { foo } merged with { } / { } should be { } / { foo }`, () => {
        // arrange

        // [todo] need some way to not have to specify a criterion. is it the "always-true" criterion i'm looking for?
        const a = createQuery({
            criteria: matches<Product>({
                rating: inRange(3, 5),
            }),
            expansion: { foo: true },
        });

        const b = createQuery({
            criteria: matches<Product>({
                rating: inRange(3, 5),
            }),
            expansion: {},
        });

        const expected = createQuery({
            criteria: matches<Product>({
                rating: inRange(3, 5),
            }),
            expansion: { foo: true },
        });
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
        const a = createQuery({
            criteria: matches<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 5),
            }),
            expansion: { foo: true },
        });

        const b = createQuery({
            criteria: matches<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 5),
            }),
            expansion: { bar: true },
        });

        const expected = createQuery({
            criteria: matches<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 5),
            }),
            expansion: { foo: true, bar: true },
        });
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
        const a = createQuery({
            criteria: matches<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 5),
            }),
            expansion: { foo: true },
        });

        const b = createQuery({
            criteria: matches<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 5),
            }),
            expansion: { foo: true },
        });

        const expected = createQuery({
            criteria: matches<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 5),
            }),
            expansion: { foo: true },
        });
        // act
        const actual = mergeQuery(a, b);

        // assert
        expect(actual).toEqual(expected);
    });

    it(`
        song({ artistId: 7 })[0, 10]
        merged with
        song({ artistId: 7 })[0, 20]
        should be
        song({ artistId: 7 })[0, 20]`, () => {
        // arrange
        const a = createQuery({
            criteria: matches({ artistId: 7 }),
            paging: new QueryPaging({ sort: [], from: 0, to: 10 }),
        });

        const b = createQuery({
            criteria: matches({ artistId: 7 }),
            paging: new QueryPaging({ sort: [], from: 0, to: 20 }),
        });

        const expected = createQuery({
            criteria: matches({ artistId: 7 }),
            paging: new QueryPaging({ sort: [], from: 0, to: 20 }),
        });

        // act
        const actual = mergeQuery(a, b);

        // assert
        expect(actual).toEqual(expected);
    });

    it(`
        song({ artistId: 7 })[0, 10]
        merged with
        song({ artistId: 7 })[0, 10]
        should be
        song({ artistId: 7 })[0, 10]`, () => {
        // arrange
        const a = createQuery({
            criteria: matches({ artistId: 7 }),
            paging: new QueryPaging({ sort: [], from: 0, to: 10 }),
        });

        const b = createQuery({
            criteria: matches({ artistId: 7 }),
            paging: new QueryPaging({ sort: [], from: 0, to: 10 }),
        });

        const expected = createQuery({
            criteria: matches({ artistId: 7 }),
            paging: new QueryPaging({ sort: [], from: 0, to: 10 }),
        });

        // act
        const actual = mergeQuery(a, b);

        // assert
        expect(actual).toEqual(expected);
    });

    it(`
        song({ artistId: 7 })[0, 10]
        merged with
        song({ artistId: 7 })[11, 20]
        should be
        song({ artistId: 7 })[0, 20]`, () => {
        // arrange
        const a = createQuery({
            criteria: matches({ artistId: 7 }),
            paging: new QueryPaging({ sort: [], from: 0, to: 10 }),
        });

        const b = createQuery({
            criteria: matches({ artistId: 7 }),
            paging: new QueryPaging({ sort: [], from: 11, to: 20 }),
        });

        const expected = createQuery({
            criteria: matches({ artistId: 7 }),
            paging: new QueryPaging({ sort: [], from: 0, to: 20 }),
        });

        // act
        const actual = mergeQuery(a, b);

        // assert
        expect(actual).toEqual(expected);
    });

    it("song({ artistId: 7 })[0, 10] should not merge with song({ artistId: 7 })[12, 20]", () => {
        // arrange
        const a = createQuery({
            criteria: matches({ artistId: 7 }),
            paging: new QueryPaging({ sort: [], from: 0, to: 10 }),
        });

        const b = createQuery({
            criteria: matches({ artistId: 7 }),
            paging: new QueryPaging({ sort: [], from: 12, to: 20 }),
        });

        const expected = false;

        // act
        const actual = mergeQuery(a, b);

        // assert
        expect(actual).toEqual(expected);
    });

    it(`
        song({ artistId: 7 })[0, 10]/{ id }
        merged with
        song({ artistId: 7 })[0, 10]/{ name }
        should be
        song({ artistId: 7 })[0, 20]/{ id, name }`, () => {
        // arrange
        const a = createQuery({
            criteria: matches({ artistId: 7 }),
            paging: new QueryPaging({ sort: [], from: 0, to: 10 }),
            expansion: { id: true },
        });

        const b = createQuery({
            criteria: matches({ artistId: 7 }),
            paging: new QueryPaging({ sort: [], from: 0, to: 10 }),
            expansion: { name: true },
        });

        const expected = createQuery({
            criteria: matches({ artistId: 7 }),
            paging: new QueryPaging({ sort: [], from: 0, to: 10 }),
            expansion: { id: true, name: true },
        });

        // act
        const actual = mergeQuery(a, b);

        // assert
        expect(actual).toEqual(expected);
    });

    it("song({ artistId: 7 })[0, 10] should not merge with song({ artistId: { 7, 9 } })[0, 10]", () => {
        // arrange
        const a = createQuery({
            criteria: matches({ artistId: 7 }),
            paging: new QueryPaging({ sort: [], from: 0, to: 10 }),
        });

        const b = createQuery({
            criteria: matches({ artistId: [7, 9] }),
            paging: new QueryPaging({ sort: [], from: 0, to: 10 }),
        });

        const expected = false;

        // act
        const actual = mergeQuery(a, b);

        // assert
        expect(actual).toEqual(expected);
    });
});
