import { describe, expect, it } from "vitest";
import { EntitySchemaCatalog } from "../../entity/entity-schema-catalog";
import { SongBlueprint } from "../../testing";
import { whereEntityToCriterion } from "./where-entity-to-criterion.fn";
import { WhereEntity } from "./where-entity.type";

describe(whereEntityToCriterion, () => {
    const catalog = new EntitySchemaCatalog();
    const songSchema = catalog.getSchemaByBlueprint(SongBlueprint);

    describe("should omit undefined values", () => {
        it("and return undefined if all criteria are undefined", () => {
            // arrange
            const where: WhereEntity = { artistId: undefined, album: { id: undefined } };

            // act & assert
            expect(whereEntityToCriterion(songSchema, where)).toBeUndefined();
        });

        it("and return a criterion for defined values", () => {
            // arrange
            const where: WhereEntity = { artistId: undefined, album: { id: 3, name: undefined }, createdAt: "now" };
            const expected = `{ album: { id: 3 }, createdAt: "now" }`;

            // act & assert
            expect(whereEntityToCriterion(songSchema, where)?.toString()).toEqual(expected);
        });
    });

    describe("should return false if contains empty arrays", () => {
        it("not nested, simple syntax", () => {
            // arrange
            const where: WhereEntity = { artistId: [] };

            // act & assert
            expect(whereEntityToCriterion(songSchema, where)?.toString()).toEqual("false");
        });

        it("not nested, verbose syntax", () => {
            // arrange
            const where: WhereEntity = { artistId: { $inArray: [] } };

            // act & assert
            expect(whereEntityToCriterion(songSchema, where)?.toString()).toEqual("false");
        });

        it("nested, simple syntax", () => {
            // arrange
            const where: WhereEntity = { album: { id: [] } };

            // act & assert
            expect(whereEntityToCriterion(songSchema, where)?.toString()).toEqual("false");
        });

        it("nested, verbose syntax", () => {
            // arrange
            const where: WhereEntity = { album: { id: { $inArray: [] } } };

            // act & assert
            expect(whereEntityToCriterion(songSchema, where)?.toString()).toEqual("false");
        });
    });

    it("should keep [undefined]", () => {
        // arrange
        const where: WhereEntity = { artistId: [undefined] };
        const expected = `{ artistId: { undefined } }`;

        // act & assert
        expect(whereEntityToCriterion(songSchema, where)?.toString()).toEqual(expected);
    });
});
