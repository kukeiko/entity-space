import { Query, createAlwaysReducible, reduceQuery, ObjectCriteria, Selection } from "src";

describe("reduceQuery()", () => {
    function createQuery(criteria: ObjectCriteria = [], selection: Selection = {}): Query {
        return { criteria, model: [], options: createAlwaysReducible(), selection };
    }

    describe("full reduction", () => {
        it("{ } should be completely reduced by { }", () => {
            // arrange
            const a = createQuery();
            const b = createQuery();

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced).toBeNull();
        });

        it("{ id in [1, 2] / { foo } } should be completely reduced by { id in [1, 2, 3] / { foo } }", () => {
            // arrange
            const a = createQuery([{ id: [{ op: "in", values: new Set([1, 2]) }] }], { foo: true });
            const b = createQuery([{ id: [{ op: "in", values: new Set([1, 2, 3]) }] }], { foo: true });

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced).toBeNull();
        });

        it("{ id in [1, 2] / { foo: { bar: { baz, mo: { dan } } } } } should be completely reduced by { id in [1, 2, 3] / { foo: { bar: { baz, khaz, mo: { dan, zoo } } } } }", () => {
            // arrange
            const a = createQuery([{ id: [{ op: "in", values: new Set([1, 2]) }] }], { foo: { bar: { baz: true, mo: { dan: true } } } });
            const b = createQuery([{ id: [{ op: "in", values: new Set([1, 2, 3]) }] }], { foo: { bar: { baz: true, khaz: true, mo: { dan: true, zoo: true } } } });

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced).toBeNull();
        });
    });

    describe("partial reduction", () => {
        it("{ id in [1, 2] } reduced by { id in [1] } should be { id in [2] }", () => {
            // arrange
            const a = createQuery([{ id: [{ op: "in", values: new Set([1, 2]) }] }]);
            const b = createQuery([{ id: [{ op: "in", values: new Set([1]) }] }]);

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced?.criteria).toEqual([{ id: [{ op: "in", values: new Set([2]) }] }]);
        });

        it("{ id in [1, 2] / { foo } } reduced by { id in [1] / { foo } } should be { id in [2] / { foo } }", () => {
            // arrange
            const a = createQuery([{ id: [{ op: "in", values: new Set([1, 2]) }] }], { foo: true });
            const b = createQuery([{ id: [{ op: "in", values: new Set([1]) }] }], { foo: true });

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced?.criteria).toEqual([{ id: [{ op: "in", values: new Set([2]) }] }]);
            expect(reduced?.selection).toEqual({ foo: true });
        });

        it("{ id in [1, 2] / { foo, bar } } reduced by { id in [1, 2] / { foo } } should be { id in [1, 2] / { bar } }", () => {
            // arrange
            const a = createQuery([{ id: [{ op: "in", values: new Set([1, 2]) }] }], { foo: true, bar: true });
            const b = createQuery([{ id: [{ op: "in", values: new Set([1, 2]) }] }], { foo: true });

            // act
            const reduced = reduceQuery(a, b);

            // assert
            expect(reduced?.criteria).toEqual([{ id: [{ op: "in", values: new Set([1, 2]) }] }]);
            expect(reduced?.selection).toEqual({ bar: true });
        });
    });
});
