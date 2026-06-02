import { EntityBlueprint } from "@entity-space/elements";
import { User, UserBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";

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

        repository.useCommon().useEntities({ users });
        repository.useCommon().useLoadUserById();

        // act
        const actual = await workspace
            .for(UserBlueprint)
            .select({ metadata: { createdBy: true } })
            .hydrate(users);

        // assert
        expect(actual).toStrictEqual(expected);
    });

    it("should hydrate property that depends on other hydrated property without explicitly selecting it", async () => {
        // arrange
        const { register, id, string, optional } = EntityBlueprint;

        class FooBlueprint {
            id = id();
            bar = string({ optional });
            baz = string({ optional });
        }

        type Foo = EntityBlueprint.Type<FooBlueprint>;
        register(FooBlueprint);

        facade
            .getServices()
            .for(FooBlueprint)
            .addHydrator({
                select: { bar: true },
                requires: { id: true },
                hydrate: ({ entities }) => entities.forEach(entity => (entity.bar = "Hello")),
            })
            .addHydrator({
                select: { baz: true },
                requires: { bar: true },
                hydrate: ({ entities }) => entities.forEach(entity => (entity.baz = `${entity.bar} World`)),
            });

        // act
        const foo: Foo = { id: 1 };
        await workspace.for(FooBlueprint).select({ baz: true }).hydrateOne(foo);

        // assert
        expect(foo.baz).toEqual("Hello World");
    });
});
