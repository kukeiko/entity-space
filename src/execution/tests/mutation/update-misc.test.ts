import { Artist, ArtistBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { UpdateEntityFn } from "../../mutation/entity-mutation-function.type";
import { TestFacade, TestRepository } from "../../testing";

describe("update()", () => {
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
        const memtrix = workspace.from(ArtistBlueprint).construct({ id: 2, namespace: "dev", name: "Memtrix" });
        const artists: Artist[] = [infectedMushroom, memtrix];
        const updateArtist = repository.useMusic().useUpdateArtist();

        // act
        await workspace.in(ArtistBlueprint).update(artists);

        // assert
        expect(updateArtist).toHaveBeenCalledTimes(2);
        expect(updateArtist).toHaveBeenNthCalledWith<Parameters<UpdateEntityFn<ArtistBlueprint>>>(1, {
            entity: infectedMushroom,
            selection: {},
        });
        expect(updateArtist).toHaveBeenNthCalledWith<Parameters<UpdateEntityFn<ArtistBlueprint>>>(2, {
            entity: memtrix,
            selection: {},
        });
    });

    it("ignores creatable entities", async () => {
        // arrange
        const infectedMushroom = workspace
            .from(ArtistBlueprint)
            .construct({ id: 1, namespace: "dev", name: "Infected Mushroom" });
        const sunnexo = workspace.from(ArtistBlueprint).construct({ name: "Sunnexo" });
        const memtrix = workspace.from(ArtistBlueprint).construct({ id: 2, namespace: "dev", name: "Memtrix" });
        const artists: Artist[] = [infectedMushroom, sunnexo, memtrix];
        const updateArtist = repository.useMusic().useUpdateArtist();
        const createArtist = repository.useMusic().useCreateArtist();

        // act
        await workspace.in(ArtistBlueprint).update(artists);

        // assert
        expect(updateArtist).toHaveBeenCalledTimes(2);
        expect(updateArtist).toHaveBeenNthCalledWith<Parameters<UpdateEntityFn<ArtistBlueprint>>>(1, {
            entity: infectedMushroom,
            selection: {},
        });
        expect(updateArtist).toHaveBeenNthCalledWith<Parameters<UpdateEntityFn<ArtistBlueprint>>>(2, {
            entity: memtrix,
            selection: {},
        });
        expect(createArtist).toHaveBeenCalledTimes(0);
    });
});
