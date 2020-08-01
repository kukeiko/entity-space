import { Query, createAlwaysReducible, reduceQuery, Criteria, Selection } from "src";

/**
 * template
 */
// it("should reduce {} by {} to create {}", () => {

// });
fdescribe("reduceQuery()", () => {
    function createQuery(criteria: Criteria = [], selection: Selection = {}): Query {
        return { criteria, model: [], options: createAlwaysReducible(), selection };
    }

    it("full reduction due to equivalency", () => {
        // both queries have empty criteria & empty selection
        {
            // arrange
            const a = createQuery();
            const b = createQuery();

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced).toBeNull();
        }
    });

    it("partial reduction", () => {
        {
            // arrange
            const a = createQuery([{ id: [{ op: "in", values: new Set([1, 2]) }] }]);
            const b = createQuery([{ id: [{ op: "==", value: 1 }] }]);

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced?.criteria).toEqual([{ id: [{ op: "==", value: 2 }] }]);
        }
    });
});
