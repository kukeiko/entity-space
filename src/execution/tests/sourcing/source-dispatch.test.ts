import { SongBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";

describe("source dispatch", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    // [todo] ❌ add test "prefer sources that filter by unique values"

    it("should dispatch query w/o any criteria to a source that only accepts optional relational criteria", async () => {
        // arrange
        const load = vi.fn(() => []);

        facade
            .getServices()
            .for(SongBlueprint)
            .addSource({ where: { artist: { id: { $equals: true, $optional: true } } }, load });

        // act
        await workspace.from(SongBlueprint).get();

        // assert
        expect(load).toHaveBeenCalledTimes(1);
    });
});
