import { User, UserBlueprint } from "@entity-space/elements/testing";
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

    it("should support pages", async () => {
        // arrange
        const users: User[] = [
            workspace.from(UserBlueprint).construct({ id: 1, name: "Susi" }),
            workspace.from(UserBlueprint).construct({ id: 2, name: "Dana" }),
            workspace.from(UserBlueprint).construct({ id: 3, name: "Maria" }),
            workspace.from(UserBlueprint).construct({ id: 4, name: "Jimmy" }),
            workspace.from(UserBlueprint).construct({ id: 5, name: "Jack" }),
        ];

        const expected = structuredClone(users)
            .sort((a, b) => b.name.localeCompare(a.name))
            .slice(2, 4);

        const loadPagedUsers = repository.useCommon().useLoadPagedUsers();
        repository.useCommon().useEntities({ users });

        // act
        const actual = await workspace.from(UserBlueprint).order({ name: true }, false).slice(2, 4).get();

        // assert
        expect(actual).toEqual(expected);
        expect(loadPagedUsers).toHaveBeenCalledWith(2, 4, [{ key: "name", ascending: false }]);
    });

    it("should support pages (cached)", async () => {
        // arrange
        const users: User[] = [
            workspace.from(UserBlueprint).construct({ id: 1, name: "Susi" }),
            workspace.from(UserBlueprint).construct({ id: 2, name: "Dana" }),
            workspace.from(UserBlueprint).construct({ id: 3, name: "Maria" }),
            workspace.from(UserBlueprint).construct({ id: 4, name: "Jimmy" }),
            workspace.from(UserBlueprint).construct({ id: 5, name: "Jack" }),
        ];

        const expected = structuredClone(users)
            .sort((a, b) => b.name.localeCompare(a.name))
            .slice(2, 4);

        const loadPagedUsers = repository.useCommon().useLoadPagedUsers();
        repository.useCommon().useEntities({ users });

        // act
        const actual = await workspace.from(UserBlueprint).order({ name: true }, false).slice(2, 4).cache(true).get();
        const actualFromCache = await workspace
            .from(UserBlueprint)
            .order({ name: true }, false)
            .slice(2, 4)
            .cache(true)
            .get();

        // assert
        expect(actual).toEqual(expected);
        expect(actualFromCache).toEqual(expected);
        expect(loadPagedUsers).toHaveBeenCalledTimes(1);
    });

    it("should return paged entities even if source is unpaged", async () => {
        // arrange
        const users: User[] = [
            workspace.from(UserBlueprint).construct({ id: 1, name: "Susi" }),
            workspace.from(UserBlueprint).construct({ id: 2, name: "Dana" }),
            workspace.from(UserBlueprint).construct({ id: 3, name: "Maria" }),
            workspace.from(UserBlueprint).construct({ id: 4, name: "Jimmy" }),
            workspace.from(UserBlueprint).construct({ id: 5, name: "Jack" }),
        ];

        const expected = structuredClone(users)
            .sort((a, b) => b.name.localeCompare(a.name))
            .slice(2, 4);

        const loadUnpagedUsers = repository.useCommon().useLoadAllUsers();
        repository.useCommon().useEntities({ users });

        // act
        const actual = await workspace.from(UserBlueprint).order({ name: true }, false).slice(2, 4).get();

        // assert
        expect(actual).toEqual(expected);
        expect(loadUnpagedUsers).toHaveBeenCalledWith();
    });
});
