import { EntityTools } from "../lib/entity/entity-tools";

interface Foo {
    id: number;
    name?: string;
    bar?: { baz?: string };
}

const { dedupeMergeEntities } = new EntityTools().toDestructurable();

describe("mergEntities()", () => {
    it("works", () => {
        // arrange
        const willBeMerged: Foo[] = [
            {
                id: 7,
                bar: {},
            },
            {
                id: 3,
                name: "three",
            },
            {
                id: 7,
                name: "seven",
                bar: { baz: "seven-bar-baz" },
            },
            {
                id: 3,
                name: "three-updated",
            },
        ];

        const expected: Foo[] = [
            { id: 7, name: "seven", bar: { baz: "seven-bar-baz" } },
            { id: 3, name: "three-updated" },
        ];

        // act
        const actual = dedupeMergeEntities(willBeMerged, ["id"]);

        // assert
        expect(actual).toEqual(expected);
    });

    it("returns empty array if given empty array", () => {
        // arrange
        const willBeMerged: Foo[] = [];
        const expected: Foo[] = [];

        // act
        const actual = dedupeMergeEntities(willBeMerged, ["id"]);

        // assert
        expect(actual).toEqual(expected);
    });
});
