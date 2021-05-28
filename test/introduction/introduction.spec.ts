import { createFromToValueCriterion, reduceFromToValueCriterion, ValueCriteria } from "../../src";

/**
 * This file serves as an introduction via code for anyone new and interested in this library.
 *
 * It is not a guide on how to use entity-space - rather, it tries to explain the core principles.
 */
describe("introduction", () => {
    it("what's reduction for?", () => {
        /**
         * Reduction serves multiple purposes - and the one we're looking at now is some simple caching.
         *
         * Let's imagine the following scenario: we have a UI rendering a list of products.
         * The user can filter those down by price, and selected to only show products with a price between 100 and 200 euro.
         *
         * They then increase the price range to 100 to 300 - and we only want to load the data that is missing, i.e. the products with a price of 200 to 300 euro.
         *
         * That means that we'll somehow cache the first result, then load the difference, merge it with what is cached, and render it.
         * However, we're only focusing on the reduction here, so there is no code that does the actual caching / loading.
         *
         * Our filter (from now on: criteria) for the first call (that is, load products with price 100 - 200) would look like this:
         */
        const initialCriteria = createFromToValueCriterion([100, 200]);

        /**
         * The criteria for the second call (200 to 300) would look like this:
         */
        const secondCriteria = createFromToValueCriterion([100, 300]);

        /**
         * We now want to know the difference between those two so we only load the difference from the server.
         * We can figure out the difference by reducing the secondCriteria by the initialCriteria, that is:
         * take away from the secondCriteria the intersection it has with the initialCriteria:
         */
        const difference = reduceFromToValueCriterion(secondCriteria, initialCriteria);

        /**
         * The difference should now be the following criteria: a from-to starting at bigger 200 until less than equals 300,
         * which represents the data we still need to load.
         */
        const expected: ValueCriteria = [{ op: "from-to", from: { op: ">", value: 200 }, to: { op: "<=", value: 300 } }];

        expect(difference).toEqual(expected);
    });
});
