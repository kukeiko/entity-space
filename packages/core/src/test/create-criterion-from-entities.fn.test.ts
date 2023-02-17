import { EntityCriteriaTools } from "../lib/criteria/vnext/entity-criteria-tools";
import { createCriterionFromEntities } from "../lib/entity/functions/create-criterion-from-entities.fn";

interface Vector {
    x: number;
    y: number;
    z: number;
}

interface Block {
    position: Vector;
    typeId: string;
}

describe("createCriterionFromEntities()", () => {
    const { where, inArray } = new EntityCriteriaTools();

    it("should create criterion for primitive index", () => {
        // arrange
        const blocks: Block[] = [
            { position: { x: 0, y: 0, z: 0 }, typeId: "minecraft:grass_block" },
            { position: { x: 0, y: -1, z: 0 }, typeId: "minecraft:dirt" },
            { position: { x: 0, y: 0, z: 0 }, typeId: "minecraft:dirt" },
        ];
        const expected = where({
            id: inArray(["minecraft:grass_block", "minecraft:dirt"]),
        });

        // act
        const actual = createCriterionFromEntities(blocks, ["typeId"], ["id"]);

        // assert
        expect(actual.toString()).toEqual(expected.toString());
    });

    it("primitive index", () => {
        interface Entity {
            foo: { bar: { baz: number | string } };
        }

        const entities: Entity[] = [
            { foo: { bar: { baz: 1 } } },
            { foo: { bar: { baz: 2 } } },
            { foo: { bar: { baz: -1 } } },
            { foo: { bar: { baz: 1 } } },
            { foo: { bar: { baz: "2" } } },
        ];

        const criterion = createCriterionFromEntities(entities, ["foo.bar.baz"]);

        expect(criterion.toString()).toEqual(`{ foo: { bar: { baz: {1, 2, -1, "2"} } } }`);
    });

    it("composite index", () => {
        interface Entity {
            foo: { bar: { baz: number } };
            cheese: number;
            khaz: { mo: number };
        }

        const entities: Entity[] = [
            {
                foo: { bar: { baz: 1 } },
                cheese: 10,
                khaz: { mo: 100 },
            },
            {
                foo: { bar: { baz: 1 } },
                cheese: 10,
                khaz: { mo: 200 },
            },
            {
                foo: { bar: { baz: 1 } },
                cheese: 20,
                khaz: { mo: 100 },
            },
            {
                foo: { bar: { baz: 1 } },
                cheese: 20,
                khaz: { mo: 200 },
            },
            {
                foo: { bar: { baz: 2 } },
                cheese: 10,
                khaz: { mo: 100 },
            },
        ];

        const criterion = createCriterionFromEntities(entities, ["foo.bar.baz", "cheese", "khaz.mo"]);

        /**
         * [todo]
         * { foo: { bar: { baz: 1 } }, cheese: 10, khaz: { mo: {100, 200} } } | { foo: { bar: { baz: 1 } }, cheese: 20, khaz: { mo: {100, 200} } }
         * could be simplified to
         * { foo: { bar: { baz: 1 } }, cheese: {10, 20}, khaz: { mo: {100, 200} } }
         */
        expect(criterion.toString()).toEqual(
            "({ foo: { bar: { baz: 1 } }, cheese: 10, khaz: { mo: {100, 200} } } | { foo: { bar: { baz: 1 } }, cheese: 20, khaz: { mo: {100, 200} } } | { foo: { bar: { baz: 2 } }, cheese: 10, khaz: { mo: {100} } })"
        );
    });

    it("composite index (mapped path)", () => {
        interface Entity {
            "foo-bar-baz": number;
            tasty: { cheese: number };
            "khaz-mo": number;
        }

        const entities: Entity[] = [
            {
                "foo-bar-baz": 1,
                tasty: { cheese: 10 },
                "khaz-mo": 100,
            },
            {
                "foo-bar-baz": 1,
                tasty: { cheese: 10 },
                "khaz-mo": 200,
            },
            {
                "foo-bar-baz": 1,
                tasty: { cheese: 20 },
                "khaz-mo": 100,
            },
            {
                "foo-bar-baz": 1,
                tasty: { cheese: 20 },
                "khaz-mo": 200,
            },
            {
                "foo-bar-baz": 2,
                tasty: { cheese: 10 },
                "khaz-mo": 100,
            },
        ];

        const criterion = createCriterionFromEntities(
            entities,
            ["foo-bar-baz", "tasty.cheese", "khaz-mo"],
            ["foo.bar.baz", "cheese", "khaz.mo"]
        );

        /**
         * [todo]
         * { foo: { bar: { baz: 1 } }, cheese: 10, khaz: { mo: {100, 200} } } | { foo: { bar: { baz: 1 } }, cheese: 20, khaz: { mo: {100, 200} } }
         * could be simplified to
         * { foo: { bar: { baz: 1 } }, cheese: {10, 20}, khaz: { mo: {100, 200} } }
         */
        expect(criterion.toString()).toEqual(
            "({ foo: { bar: { baz: 1 } }, cheese: 10, khaz: { mo: {100, 200} } } | { foo: { bar: { baz: 1 } }, cheese: 20, khaz: { mo: {100, 200} } } | { foo: { bar: { baz: 2 } }, cheese: 10, khaz: { mo: {100} } })"
        );
    });
});
