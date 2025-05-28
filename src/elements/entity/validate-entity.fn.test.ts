import { describe, expect, it } from "vitest";
import { Entity } from "./entity";
import { ContainerType } from "./entity-property";
import { EntitySchema } from "./entity-schema";
import { isCreatableEntityProperty } from "./is-creatable-entity-property.fn";
import { EntityValidationErrors, validateEntity } from "./validate-entity.fn";

describe(validateEntity, () => {
    const schema = new EntitySchema("foo")
        .addPrimitive("optionalNumber", Number, { optional: true })
        .addPrimitive("nullableNumber", Number, { nullable: true })
        .addPrimitive("requiredNumber", Number)
        .addPrimitive("numberArray", Number, { container: ContainerType.Array })
        .addPrimitive("string", String, { optional: true });

    // reusing the same schema to test validation of related entities
    schema.addRelation("parent", schema, { optional: true });
    schema.addRelation("children", schema, { container: ContainerType.Array, optional: true });

    it("should return undefined if entity is valid", () => {
        // arrange
        const entity: Entity = {
            optionalNumber: undefined,
            nullableNumber: null,
            requiredNumber: 3,
            numberArray: [1, 2, 3],
            parent: {
                optionalNumber: undefined,
                nullableNumber: null,
                requiredNumber: 3,
                numberArray: [1, 2, 3],
            },
            children: [{ optionalNumber: undefined, nullableNumber: null, requiredNumber: 3, numberArray: [1, 2, 3] }],
        };

        // act & assert
        expect(validateEntity(schema, entity)).toBeUndefined();
    });

    it("should return errors for invalid properties", () => {
        // arrange
        const entity: Entity = {
            optionalNumber: null, // should not be null
            requiredNumber: "foo", // should not be string
            numberArray: [1, "2", null, undefined], // contains non-numbers
        };

        const parent = { ...entity };
        const children = [{ ...entity }];
        entity.parent = parent;
        entity.children = children;
        entity.string = [1];

        const expected: EntityValidationErrors = {
            nullableNumber: "property is required",
            "parent.nullableNumber": "property is required",
            "children[0].nullableNumber": "property is required",
            "numberArray[1]": "value at index 1 is not of type number (got string)",
            "parent.numberArray[1]": "value at index 1 is not of type number (got string)",
            "children[0].numberArray[1]": "value at index 1 is not of type number (got string)",
            "numberArray[2]": "value at index 2 is not of type number (got null)",
            "parent.numberArray[2]": "value at index 2 is not of type number (got null)",
            "children[0].numberArray[2]": "value at index 2 is not of type number (got null)",
            "numberArray[3]": "value at index 3 is not of type number (got undefined)",
            "parent.numberArray[3]": "value at index 3 is not of type number (got undefined)",
            "children[0].numberArray[3]": "value at index 3 is not of type number (got undefined)",
            requiredNumber: "value is not of type number (got string)",
            "parent.requiredNumber": "value is not of type number (got string)",
            "children[0].requiredNumber": "value is not of type number (got string)",
            optionalNumber: "property is not nullable",
            "parent.optionalNumber": "property is not nullable",
            "children[0].optionalNumber": "property is not nullable",
            string: "property is not an array",
        };

        // act
        const actual = validateEntity(schema, entity);

        // assert
        expect(actual).toEqual(expected);
    });

    it("should return errors if entity has properties not defined in the schema", () => {
        // arrange
        const schema = new EntitySchema("foo").addPrimitive("number", Number);
        const entity: Entity = { number: 3, doesntExist: 7 };
        const expected: EntityValidationErrors = { doesntExist: "property doesn't exist" };

        // act
        const actual = validateEntity(schema, entity);

        // assert
        expect(actual).toEqual(expected);
    });

    describe("should allow a custom predicate to filter properties", () => {
        it("to validate if an entity is creatable", () => {
            // arrange
            const schema = new EntitySchema("foo")
                .addPrimitive("creatableNumber", Number)
                .addPrimitive("creatableOptionalNumber", Number, { optional: true })
                .addPrimitive("readonlyNumber", Number, { readonly: true });

            const entity: Entity = { creatableOptionalNumber: 3, readonlyNumber: 8, doesntExist: 7 };

            const expected: EntityValidationErrors = {
                creatableNumber: "property is required",
                readonlyNumber: "property is not creatable",
                doesntExist: "property doesn't exist",
            };

            // act
            const actual = validateEntity(
                schema,
                entity,
                undefined,
                isCreatableEntityProperty,
                "property is not creatable",
            );

            // assert
            expect(actual).toEqual(expected);
        });
    });
});
