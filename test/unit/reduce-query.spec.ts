import { Query, createAlwaysReducible, reduceQuery, Criteria, Selection } from "src";

describe("reduceQuery()", () => {
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
            const b = createQuery([{ id: [{ op: "in", values: new Set([1]) }] }]);

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced?.criteria).toEqual([{ id: [{ op: "in", values: new Set([2]) }] }]);
        }
    });
});
