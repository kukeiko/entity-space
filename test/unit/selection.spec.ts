import { ObjectSelection } from "src";

describe("ObjectSelection", () => {
    describe("merge()", () => {
        it("should merge { foo: true } and { bar: true } to create { foo: true, bar: true }", () => {
            // arrange
            const a: ObjectSelection = { foo: true };
            const b: ObjectSelection = { bar: true };

            // act
            const merged = ObjectSelection.merge(a, b);

            // assert
            expect(merged).toEqual({ foo: true, bar: true });
        });

        it("should merge { foo: { bar: true } } and { foo: { baz: true } } to create { foo: { bar: true, baz: true } }", () => {
            // arrange
            const a: ObjectSelection = { foo: { bar: true } };
            const b: ObjectSelection = { foo: { baz: true } };

            // act
            const merged = ObjectSelection.merge(a, b);

            // assert
            expect(merged).toEqual({ foo: { bar: true, baz: true } });
        });

        it("should merge { foo: true } and { foo: { bar: true } } to create { foo: { bar: true } }", () => {
            // arrange
            const a: ObjectSelection = { foo: true };
            const b: ObjectSelection = { foo: { bar: true } };

            // act
            const merged = ObjectSelection.merge(a, b);

            // assert
            expect(merged).toEqual({ foo: { bar: true } });
        });
    });

    describe("reduce()", () => {
        it("should reduce { foo: true, bar: true } by { foo: true } to create { bar: true }", () => {
            // arrange
            const a: ObjectSelection = { foo: true, bar: true };
            const b: ObjectSelection = { foo: true };

            // act
            const reduced = ObjectSelection.reduce(a, b);

            // assert
            expect(reduced).toEqual({ bar: true });
        });

        it("should reduce { foo: true, bar: true } by { foo: true, bar: true } to create null", () => {
            // arrange
            const a: ObjectSelection = { foo: true, bar: true };
            const b: ObjectSelection = { foo: true, bar: true };

            // act
            const reduced = ObjectSelection.reduce(a, b);

            // assert
            expect(reduced).toBeNull();
        });

        it("should not reduce { foo: true, bar: true } by { baz: true } and return same reference", () => {
            // arrange
            const a: ObjectSelection = { foo: true, bar: true };
            const b: ObjectSelection = { baz: true };

            // act
            const reduced = ObjectSelection.reduce(a, b);

            // assert
            expect(reduced).toBe(a);
        });

        it("should reduce { foo: { bar: true, baz: true }, khaz: { mo: true } } by { foo: { bar: true }, khaz: { mo: true, dan: true } } to create { foo: { baz: true } }", () => {
            // arrange
            const a: ObjectSelection = { foo: { bar: true, baz: true }, khaz: { mo: true } };
            const b: ObjectSelection = { foo: { bar: true }, khaz: { mo: true, dan: true } };

            // act
            const reduced = ObjectSelection.reduce(a, b);

            // assert
            expect(reduced).toEqual({ foo: { baz: true } });
        });

        it("{ foo: {} } reduced by { foo: {} } should be null", () => {
            // arrange
            const a: ObjectSelection = { foo: {} };
            const b: ObjectSelection = { foo: {} };

            // act
            const reduced = ObjectSelection.reduce(a, b);

            // assert
            expect(reduced).toBeNull();
        });
    });

    describe("isSuperset()", () => {
        it("{ foo: true, bar: true } should be a superset of { foo: true }", () => {
            // arrange
            const a: ObjectSelection = { foo: true, bar: true };
            const b: ObjectSelection = { foo: true };

            // act
            const isSuperset = ObjectSelection.isSuperset(a, b);

            // assert
            expect(isSuperset).toBeTrue();
        });
    });
});
