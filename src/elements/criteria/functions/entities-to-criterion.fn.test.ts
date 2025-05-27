import { toPaths } from "@entity-space/utils";
import { describe, expect, it } from "vitest";
import { Criterion } from "../criterion";
import { EntityCriterion } from "../entity-criterion";
import { InArrayCriterion } from "../in-array-criterion";
import { entitiesToCriterion } from "./entities-to-criterion.fn";

describe(entitiesToCriterion, () => {
    interface Vector {
        x: number;
        y: number;
        z: number;
    }

    interface Block {
        position: Vector;
        typeId: string;
    }

    const where = <T extends any>(criteria: Partial<Record<keyof T, Criterion>>) =>
        new EntityCriterion(criteria as any);

    it("should create criterion for primitive index", () => {
        // arrange
        const blocks: Block[] = [
            { position: { x: 0, y: 0, z: 0 }, typeId: "minecraft:grass_block" },
            { position: { x: 0, y: -1, z: 0 }, typeId: "minecraft:dirt" },
            { position: { x: 0, y: 0, z: 0 }, typeId: "minecraft:dirt" },
        ];
        const expected = where({
            id: new InArrayCriterion(["minecraft:grass_block", "minecraft:dirt"]),
        });

        // act
        const actual = entitiesToCriterion(blocks, toPaths(["typeId"]), toPaths(["id"]));

        // assert
        expect(actual).toBeDefined();
        expect(actual!.toString()).toEqual(expected.toString());
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

        const criterion = entitiesToCriterion(entities, toPaths(["foo.bar.baz", "cheese", "khaz.mo"]));

        /**
         * [todo]
         * { foo: { bar: { baz: 1 } }, cheese: 10, khaz: { mo: {100, 200} } } | { foo: { bar: { baz: 1 } }, cheese: 20, khaz: { mo: {100, 200} } }
         * could be simplified to
         * { foo: { bar: { baz: 1 } }, cheese: {10, 20}, khaz: { mo: {100, 200} } }
         */
        expect(criterion!.toString()).toEqual(
            "({ foo: { bar: { baz: 1 } }, cheese: 10, khaz: { mo: { 100, 200 } } } | { foo: { bar: { baz: 1 } }, cheese: 20, khaz: { mo: { 100, 200 } } } | { foo: { bar: { baz: 2 } }, cheese: 10, khaz: { mo: { 100 } } })",
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

        const criterion = entitiesToCriterion(
            entities,
            toPaths(["foo-bar-baz", "tasty.cheese", "khaz-mo"]),
            toPaths(["foo.bar.baz", "cheese", "khaz.mo"]),
        );

        /**
         * [todo]
         * { foo: { bar: { baz: 1 } }, cheese: 10, khaz: { mo: {100, 200} } } | { foo: { bar: { baz: 1 } }, cheese: 20, khaz: { mo: {100, 200} } }
         * could be simplified to
         * { foo: { bar: { baz: 1 } }, cheese: {10, 20}, khaz: { mo: {100, 200} } }
         */
        expect(criterion!.toString()).toEqual(
            "({ foo: { bar: { baz: 1 } }, cheese: 10, khaz: { mo: { 100, 200 } } } | { foo: { bar: { baz: 1 } }, cheese: 20, khaz: { mo: { 100, 200 } } } | { foo: { bar: { baz: 2 } }, cheese: 10, khaz: { mo: { 100 } } })",
        );
    });
});
