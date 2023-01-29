import { EntitySchema } from "../lib/schema/entity-schema";
import { mergeEntities } from "../lib/entity/functions/merge-entities.fn";

interface Foo {
    id: number;
    name?: string;
    bar?: { baz?: string };
}

const fooSchema = new EntitySchema("foo").addInteger("id").setKey("id").addString("name");

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
        const actual = mergeEntities(fooSchema, willBeMerged);

        // assert
        expect(actual).toEqual(expected);

        for (const entity of actual) {
            const original = willBeMerged.find(candidate => candidate.id === entity.id);
            expect(entity).toBe(original);
            expect(entity.bar).toBe(original?.bar);
        }
    });

    it("returns empty array if given empty array", () => {
        // arrange
        const willBeMerged: Foo[] = [];
        const expected: Foo[] = [];

        // act
        const actual = mergeEntities(fooSchema, willBeMerged);

        // assert
        expect(actual).toEqual(expected);
    });
});
