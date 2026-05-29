import { Artist, ArtistBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { CreateEntityFn } from "../../mutation/entity-mutation-function.type";
import { TestFacade, TestRepository } from "../../testing";

describe("create()", () => {
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
        const infectedMushroom = workspace
            .from(ArtistBlueprint)
            .construct({ id: 1, namespace: "dev", name: "Infected Mushroom" });
        const sunnexo = workspace.from(ArtistBlueprint).construct({ name: "Sunnexo" });
        // [todo] ❌ hack until I've figured out (and implemented) how exactly entities are passed to mutators
        const expected = { ...structuredClone(sunnexo), metadata: undefined };
        const memtrix = workspace.from(ArtistBlueprint).construct({ id: 2, namespace: "dev", name: "Memtrix" });

        const artists: Artist[] = [infectedMushroom, sunnexo, memtrix];

        const updateArtist = repository.useMusic().useUpdateArtist();
        const createArtist = repository.useMusic().useCreateArtist();

        // act
        await workspace.in(ArtistBlueprint).create(artists);

        // assert
        expect(createArtist).toHaveBeenCalledTimes(1);
        expect(createArtist).toHaveBeenNthCalledWith<Parameters<CreateEntityFn<ArtistBlueprint>>>(1, {
            // [todo] ❌ hack until I've figured out (and implemented) how exactly entities are passed to mutators
            entity: expected as any,
            selection: {},
        });
        expect(updateArtist).toHaveBeenCalledTimes(0);
    });
});
