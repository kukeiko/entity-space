import { describe, expect, it } from "vitest";
import { OData, ODataCriterion } from "./odata";

describe("toFilterQueryParameter()", () => {
    describe("should correctly interpret a date string", () => {
        const criterion: ODataCriterion = {
            property: "createdAt",
            operation: "eq",
            value: "2026-10-18T13:29:39.289Z",
        };

        it("v2", () => {
            // arrange
            const expected = "createdAt eq datetimeoffset'2026-10-18T13:29:39.289Z'";

            // act
            const actual = OData.toFilterQueryParameter(criterion);

            // assert
            expect(actual).toEqual(expected);
        });

        it("v4", () => {
            // arrange
            const expected = "createdAt eq 2026-10-18T13:29:39.289Z";

            // act
            const actual = OData.toFilterQueryParameter(criterion, true);

            // assert
            expect(actual).toEqual(expected);
        });
    });

    describe("should not interpret a numeric string as a date", () => {
        // arrange
        const criterion: ODataCriterion = { property: "name", operation: "eq", value: "64" };
        const expected = "name eq '64'";

        it("v2", () => {
            // act
            const actual = OData.toFilterQueryParameter(criterion);

            // assert
            expect(actual).toEqual(expected);
        });

        it("v4", () => {
            // act
            const actual = OData.toFilterQueryParameter(criterion, true);

            // assert
            expect(actual).toEqual(expected);
        });
    });
});
