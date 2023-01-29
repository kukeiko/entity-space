import { EntitySchema, PackedEntitySelection } from "@entity-space/common";
import { EntitySelection } from "../../lib/query/entity-selection";
import { EntityQuery } from "../../lib/query/entity-query";
import { subtractQuery } from "../../lib/query/subtract-query.fn";
import { inRange } from "../../lib/criteria/criterion/range/in-range.fn";
import { matches } from "../../lib/criteria/criterion/named/matches.fn";
import { or } from "../../lib/criteria/criterion/or/or.fn";

/**
 * This file serves as an introduction via code for anyone new and interested in this library.
 *
 * It is not a guide on how to use entity-space - rather, it tries to explain the core principles.
 */
describe("what's reduction for?", () => {
    it("a quick example", () => {
        /**
         * Let's just jump right into a simple reduction case: we have two ranges and want to figure out the difference between them.
         */
        const from_100_to_200 = inRange(100, 200);
        const from_100_to_300 = inRange(100, 300);
        const expected = inRange(200, 300, [false, true]);

        const difference = from_100_to_200.subtractFrom(from_100_to_300);

        expect(difference).toEqual(expected);
    });

    it("explaining the quick example", () => {
        /**
         * Reduction serves multiple purposes - and the one we're looking at now is some simple caching.
         *
         * Let's imagine the following scenario: we have a UI rendering a list of products.
         * The user can filter those down by price, and they initially selected to only show products with a price between 100 and 200 euro.
         *
         * They then increase the price range to 100 to 300 - and we only want to load the data that is missing, i.e. the products with a price of 200 to 300 euro.
         *
         * That means that we'll somehow cache the first result, then load the difference, merge it with what is cached, and render it.
         * However, we're only focusing on the reduction here, so there is no code that does the actual caching / loading.
         *
         * Our filter (from now on: criteria) for the first call (that is, load products with price 100 - 200) would look like this:
         */
        const from_100_to_200 = inRange(100, 200);

        /**
         * The criteria for the second call (100 to 300) would look like this:
         */
        const from_100_to_300 = inRange(100, 300);

        /**
         * We now want to know the difference between those two so we only load the difference from the server.
         * We can figure out the difference by reducing the secondCriteria by the initialCriteria, that is:
         * take away from the secondCriteria the intersection it has with the initialCriteria:
         */
        const difference = from_100_to_200.subtractFrom(from_100_to_300);

        /**
         * The difference should now be the following criteria: a range starting at bigger 200 until less than equals 300,
         * which represents the data we still need to load.
         */
        const expected = inRange(200, 300, [false, true]);

        expect(difference).toEqual(expected);
    });

    it("creating range criteria", () => {
        /**
         * Typing out criteria like this: { op: "range", from: { op: ">=", value: 100 }, to: { op: "<=", value: 200 } }
         * is a lot of typing to do. So lets explore all the ways we can create ranges in a shorter way:
         */
        // const from_100_to_200 = inRange([100, 200]);
        // expect(from_100_to_200).toEqual({ op: "range", from: { op: ">=", value: 100 }, to: { op: "<=", value: 200 } });
        // const from_bigger_100_to_200 = inRange([100, 200], [false, true]);
        // expect(from_bigger_100_to_200).toEqual({ op: "range", from: { op: ">", value: 100 }, to: { op: "<=", value: 200 } });
        // const from_100_to_less_200 = inRange([100, 200], [true, false]);
        // expect(from_100_to_less_200).toEqual({ op: "range", from: { op: ">=", value: 100 }, to: { op: "<", value: 200 } });
        // const from_bigger_100_to_less_200 = inRange([100, 200], [false, false]);
        // expect(from_bigger_100_to_less_200).toEqual({ op: "range", from: { op: ">", value: 100 }, to: { op: "<", value: 200 } });
        // const from_bigger_100_to_less_200_shorter = inRange([100, 200], false);
        // expect(from_bigger_100_to_less_200_shorter).toEqual(from_bigger_100_to_less_200);
        // const to_200 = inRange([void 0, 200]);
        // expect(to_200).toEqual({ op: "range", to: { op: "<=", value: 200 } });
        // const less_than_200 = inRange([void 0, 200], false);
        // expect(less_than_200).toEqual({ op: "range", to: { op: "<", value: 200 } });
        // const from_100 = inRange([100, void 0]);
        // expect(from_100).toEqual({ op: "range", from: { op: ">=", value: 100 } });
        // const bigger_than_100 = inRange([100, void 0], false);
        // expect(bigger_than_100).toEqual({ op: "range", from: { op: ">", value: 100 } });
    });

    it("a bit more complex criteria reduction", () => {
        /**
         * We previously only covered the case of reducing the price - but what if the user can also filter by rating?
         *
         * So lets assume again that the user wanted all products with a price of 100 to 200 euro, but now also with a rating of at least 3 (assuming 1 = worst, 5 = best).
         * After that they decide to show products with a price of 100 to 300, and a ranking of at least 2.
         *
         * The criteria for our first call would look like this:
         */
        const price_100_to_200_rating_3_to_5 = matches({
            price: inRange(100, 200),
            rating: inRange(3, 5),
        });

        /**
         * The criteria for the second call would look like this:
         */
        const price_100_to_300_rating_2_to_5 = matches({
            price: inRange(100, 300),
            rating: inRange(2, 5),
        });

        /**
         * So not only do we want products of a bigger price range, but we now also want products with a bigger rating range.
         *
         * We'll therefore have to load all the products with price of 200 to 300 and rating 2 to 5, and load all products with price of 100 to 200 and rating 2 to 3.
         */
        const expected = or([
            matches({
                price: inRange(200, 300, [false, true]),
                rating: inRange(2, 5),
            }),
            matches({
                price: inRange(100, 200),
                rating: inRange(2, 3, [true, false]),
            }),
        ]);

        /**
         * We're now using the "reduceObjectCriterion()" method as we want to reduce criteria that span across multiple properties.
         */
        const difference = price_100_to_200_rating_3_to_5.subtractFrom(price_100_to_300_rating_2_to_5);

        /**
         * Note: we have to do a "arrayWithExactContents" here to ignore the order of elements inside "expected".
         */
        // expect(difference).toEqual(jasmine.arrayWithExactContents(expected));
        expect(difference).toEqual(expected);
    });

    it("selection subtraction", () => {
        /**
         * So we have a mechanism to figure out the data we're missing on the criteria level - but what about the property level?
         *
         * We want our app to be able to only load what's needed, i.e. pick the properties we want. And sometimes we want to load
         * additional properties later on - so we'll need the same reduction mechanism to figure out what we already have in cache.
         *
         * We call an object that tells us which properties to load a "Selection". Our initial selection of our products will contain
         * the id, the name, the price and the rating.
         */
        const basic_properties: PackedEntitySelection = {
            id: true,
            name: true,
            price: true,
            rating: true,
        };

        /**
         * Later on we also want to load the customer reviews of the product:
         */
        const basic_properties_with_reviews: PackedEntitySelection = {
            ...basic_properties,
            reviews: true,
        };

        /**
         * Since we've loaded the basic_properties_only already, the difference should just be the reviews:
         */
        const expected: PackedEntitySelection = {
            reviews: true,
        };

        const actual = EntitySelection.subtractValue(basic_properties_with_reviews, basic_properties);

        expect(actual).toEqual(expected);
    });

    it("query subtraction", () => {
        /**
         * Let's now combine both concepts: criteria + selection reduction.
         *
         * We're going to load products with a price range of 100 to 200, rating range of 3 to 5, without reviews.
         * We then load products with price range of 100 to 300, rating range of 2 to 5, including the reviews.
         */
        const basic_properties: PackedEntitySelection = {
            id: true,
            name: true,
            price: true,
            rating: true,
        };

        const review_property: PackedEntitySelection = {
            reviews: true,
        };

        const productSchema = new EntitySchema("product");

        const price_100_to_200_rating_3_to_5_no_reviews = new EntityQuery({
            entitySchema: productSchema,
            criteria: matches({
                price: inRange(100, 200),
                rating: inRange(3, 5),
            }),
            selection: {
                ...basic_properties,
            },
        });

        const price_100_to_300_rating_2_to_5_with_reviews = new EntityQuery({
            entitySchema: productSchema,
            criteria: matches({
                price: inRange(100, 300),
                rating: inRange(2, 5),
            }),
            selection: {
                ...basic_properties,
                ...review_property,
            },
        });

        /**
         * Our expected outcome is two queries:
         */
        const expected: EntityQuery[] = [
            // one for loading the missing entities
            new EntityQuery({
                entitySchema: productSchema,
                criteria: or([
                    matches({
                        price: inRange(200, 300, [false, true]),
                        rating: inRange(2, 5),
                    }),
                    matches({
                        price: inRange(100, 200),
                        rating: inRange(2, 3, [true, false]),
                    }),
                ]),
                selection: {
                    ...basic_properties,
                    ...review_property,
                },
            }),
            // and one for loading the missing properties (i.e. the reviews) of the entities we already have
            new EntityQuery({
                entitySchema: productSchema,
                criteria: matches({
                    price: inRange(100, 200),
                    rating: inRange(3, 5),
                }),
                selection: {
                    ...review_property,
                },
            }),
        ];

        const actual = subtractQuery(
            price_100_to_300_rating_2_to_5_with_reviews,
            price_100_to_200_rating_3_to_5_no_reviews
        );

        expect((actual as []).length).toEqual(expected.length);
        expect(actual).toEqual(expect.arrayContaining(expected));
    });
});
