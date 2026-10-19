import { EntityBlueprint, EntitySchemaCatalog } from "@entity-space/elements";
import { describe, expect, it } from "vitest";
import { ODataCriterion } from "./odata";
import { toODataCriterion } from "./to-odata-criterion.fn";

const { register, string } = EntityBlueprint;

describe("toODataCriterion()", () => {
    it("should work", () => {
        // arrange
        class FooBlueprint {
            createdAt = string();
        }

        register(FooBlueprint);
        const schema = new EntitySchemaCatalog().getSchemaByBlueprint(FooBlueprint);
        const createdAt = "2026-10-18T13:29:39.289Z";
        const expected: ODataCriterion = { property: "createdAt", operation: "eq", value: createdAt };

        // act
        const actual = toODataCriterion(schema, { createdAt });

        // assert
        expect(actual).toEqual(expected);
    });
});
