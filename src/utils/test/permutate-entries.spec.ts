import { permutateEntries, permutateEntries_V2 } from "../permutate-entries.fn";

describe("permutateEntries()", () => {
    type Entries = [string, any[]][];

    it("should permutate into 2 items (V2)", () => {
        // arrange
        const item = {
            foo: ["foo-A", "foo-B"],
            bar: "bar-A",
        };

        const expected = [
            {
                foo: "foo-A",
                bar: "bar-A",
            },
            {
                foo: "foo-B",
                bar: "bar-A",
            },
        ];

        // act
        const permutated = permutateEntries_V2(item);

        // assert
        expect(permutated).toEqual(expected);
    });

    it("should permutate into 2 items", () => {
        // arrange
        const entries: Entries = [
            ["foo", ["foo-A", "foo-B"]],
            ["bar", ["bar-A"]],
        ];

        const expected = [
            {
                foo: "foo-A",
                bar: "bar-A",
            },
            {
                foo: "foo-B",
                bar: "bar-A",
            },
        ];

        // act
        const permutated = permutateEntries(entries);

        // assert
        expect(permutated).toEqual(expected);
    });

    it("should permutate into 4 items", () => {
        // arrange
        const entries: Entries = [
            ["foo", ["foo-A", "foo-B"]],
            ["bar", ["bar-A", "bar-B"]],
        ];

        const expected = [
            {
                foo: "foo-A",
                bar: "bar-A",
            },
            {
                foo: "foo-A",
                bar: "bar-B",
            },
            {
                foo: "foo-B",
                bar: "bar-B",
            },
            {
                foo: "foo-B",
                bar: "bar-A",
            },
        ];

        // act
        const permutated = permutateEntries(entries);

        // assert
        expect(permutated).toEqual(jasmine.arrayWithExactContents(expected));
    });
});
