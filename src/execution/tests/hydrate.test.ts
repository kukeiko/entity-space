import { User, UserBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../entity-workspace";
import { TestFacade, TestRepository } from "../testing";

describe("hydrate()", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("should hydrate provided entities", async () => {
        // arrange
        const users: User[] = [
            {
                id: 1,
                name: "Susi Sonne",
                metadata: { createdById: 2, createdAt: new Date().toISOString(), updatedAt: null, updatedById: null },
            },
            {
                id: 2,
                name: "Mara Mauzi",
                metadata: { createdById: 3, createdAt: new Date().toISOString(), updatedAt: null, updatedById: null },
            },
            {
                id: 3,
                name: "Dana Dandy",
                metadata: { createdById: 1, createdAt: new Date().toISOString(), updatedAt: null, updatedById: null },
            },
        ];

        const getUserById = (id: number) => {
            const user = users.find(user => user.id === id);

            if (!user) {
                throw new Error(`bad test data, did not find user by id ${id}`);
            }

            return structuredClone(user);
        };

        const expected = users.map(user => ({
            ...user,
            metadata: { ...user.metadata, createdBy: getUserById(user.metadata.createdById) },
        }));

        repository.useEntities({ users });
        repository.useLoadUserById();

        // act
        const actual = await workspace
            .for(UserBlueprint)
            .select({ metadata: { createdBy: true } })
            .hydrate(users);

        // assert
        expect(actual).toStrictEqual(expected);
    });
});
