import { describe, expect, it } from "vitest";
import { whereEntityToCriterion } from "./where-entity-to-criterion.fn";
import { WhereEntity } from "./where-entity.type";

describe(whereEntityToCriterion, () => {
    describe("should ignore undefined", () => {
        it("and return undefined as all values are undefined", () => {
            // arrange
            const where: WhereEntity = { artistId: undefined, album: { id: undefined } };

            // act & assert
            expect(whereEntityToCriterion(where)).toBeUndefined();
        });

        it("and return a criterion where values were not undefined", () => {
            // arrange
            const where: WhereEntity = { artistId: undefined, album: { id: 3, name: undefined }, createdAt: "now" };
            const expected = `{ album: { id: 3 }, createdAt: "now" }`;

            // act & assert
            expect(whereEntityToCriterion(where)?.toString()).toEqual(expected);
        });
    });

    describe("should ignore empty arrays", () => {
        it("and return undefined as all arrays were empty", () => {
            // arrange
            const where: WhereEntity = { artistId: [], album: { id: [] } };

            // act & assert
            expect(whereEntityToCriterion(where)).toBeUndefined();
        });

        it("and return a criterion where values were not undefined", () => {
            // arrange
            const where: WhereEntity = { artistId: [], album: { id: 3, name: [] }, createdAt: "now" };
            const expected = `{ album: { id: 3 }, createdAt: "now" }`;

            // act & assert
            expect(whereEntityToCriterion(where)?.toString()).toEqual(expected);
        });
    });

    it("should keep [undefined]", () => {
        // arrange
        const where: WhereEntity = { artistId: [undefined] };
        const expected = `{ artistId: { undefined } }`;

        // act & assert
        expect(whereEntityToCriterion(where)?.toString()).toEqual(expected);
    });
});
