import { Shape, ShapeBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";

describe("get()", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("should work", async () => {
        // arrange
        const id = 7;
        const shape: Shape = { id, type: "circle", radius: 7 };
        repository
            .useShapes()
            .useEntities({ shapes: [shape] })
            .useLoadShapeById();

        // act
        const actual = await workspace.from(ShapeBlueprint).where({ id }).getOne();

        // asserts
        expect(actual).toEqual(shape);
    });
});
