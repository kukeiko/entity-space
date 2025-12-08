import { User, UserBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../entity-workspace";
import { TestFacade, TestRepository } from "../testing";
import { createMetadata } from "../testing/default-entities";

describe("a partial cache", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("does not break hydration when using refresh", async () => {
        // arrange
        const users: User[] = [
            { id: 1, name: "Mara Mauzi", metadata: createMetadata(2) },
            { id: 2, name: "Susi Sonne", metadata: createMetadata(3) },
        ];

        repository.useEntities({ users });
        repository.useLoadUserById();
        repository.useHydrateUserCreatedByName();

        // act
        // first we're loading "Mara Mauzi" into the cache
        await workspace.from(UserBlueprint).where({ id: 1 }).cache(true).get();

        const load = () => {
            // then we load "Mara Mauzi" again, hydrating "createdByName" which requires hydration of "metadata.createdBy".
            // because we're using "refresh: true", the system will first load only from cache, then from source.
            // "Susi Sonne" (which is metadata.createdBy) does not exist yet in cache - so hydration of "createdByName"
            // for "Mara Mauzi" should be skipped while loading from cache.
            return workspace
                .from(UserBlueprint)
                .where({ id: 1 })
                .select({ createdByName: true })
                .cache({ refresh: true })
                .get();
        };

        // assert
        await expect(load()).resolves.not.toThrow();
    });
});
