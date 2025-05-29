import { describe, expect, it } from "vitest";
import { EntityCriterionShape } from "../criteria/entity-criterion-shape";
import { EntitySchema } from "../entity/entity-schema";
import { EntityQueryShape } from "./entity-query-shape";
import { reshapeQueryShape } from "./reshape-query-shape.fn";

describe(reshapeQueryShape, () => {
    it("a shape with only optional criteria should reshape a query with no criteria", () => {
        // arrange
        const schema = new EntitySchema("foo").addPrimitive("id", Number);
        const what = new EntityQueryShape(schema, { id: true });
        const by = new EntityQueryShape(schema, { id: true }, new EntityCriterionShape({}, { id: Number }));
        const expected = new EntityQueryShape(schema, { id: true }, new EntityCriterionShape({}, { id: Number }));

        // act
        const actual = reshapeQueryShape(what, by);

        // assert
        expect(actual).not.toBe(false);

        if (actual !== false) {
            expect(actual.getOpenForCriteria()).toBeUndefined();
            expect(actual.getOpenForSelection()).toBeUndefined();
            expect(actual.getReshaped().toString()).toEqual(expected.toString());
        }
    });
});
