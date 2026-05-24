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

    describe("should prefer sources filtering by unique values", () => {
        it("unique filter source declared first", async () => {
            // arrange
            const loadById = vi.fn(() => []);
            const loadByArtistId = vi.fn(() => []);

            facade
                .getServices()
                .for(SongBlueprint)
                .addSource({ where: { artistId: { $equals: true } }, load: loadByArtistId })
                .addSource({ where: { id: { $equals: true }, namespace: { $equals: true } }, load: loadById });

            // act
            await workspace.from(SongBlueprint).where({ id: 1, namespace: "dev", artistId: 2 }).get();

            // assert
            expect(loadById).toHaveBeenCalledTimes(1);
            expect(loadByArtistId).toHaveBeenCalledTimes(0);
        });

        it("unique filter source declared last", async () => {
            // arrange
            const loadById = vi.fn(() => []);
            const loadByArtistId = vi.fn(() => []);

            facade
                .getServices()
                .for(SongBlueprint)
                .addSource({ where: { id: { $equals: true }, namespace: { $equals: true } }, load: loadById })
                .addSource({ where: { artistId: { $equals: true } }, load: loadByArtistId });

            // act
            await workspace.from(SongBlueprint).where({ id: 1, namespace: "dev", artistId: 2 }).get();

            // assert
            expect(loadById).toHaveBeenCalledTimes(1);
            expect(loadByArtistId).toHaveBeenCalledTimes(0);
        });
    });

    describe("should prefer dispatching to sources making less API calls", () => {
        it("less API calls source declared first", async () => {
            // arrange
            const loadById = vi.fn(() => []);
            const loadByIds = vi.fn(() => []);

            facade
                .getServices()
                .for(SongBlueprint)
                .addSource({ where: { id: { $inArray: true }, namespace: { $equals: true } }, load: loadByIds })
                .addSource({ where: { id: { $equals: true }, namespace: { $equals: true } }, load: loadById });

            // act
            await workspace
                .from(SongBlueprint)
                .where({ id: [1, 2], namespace: "dev", artistId: 2 })
                .get();

            // assert
            expect(loadById).toHaveBeenCalledTimes(0);
            expect(loadByIds).toHaveBeenCalledTimes(1);
        });

        it("less API calls source declared last", async () => {
            // arrange
            const loadById = vi.fn(() => []);
            const loadByIds = vi.fn(() => []);

            facade
                .getServices()
                .for(SongBlueprint)
                .addSource({ where: { id: { $equals: true }, namespace: { $equals: true } }, load: loadById })
                .addSource({ where: { id: { $inArray: true }, namespace: { $equals: true } }, load: loadByIds });

            // act
            await workspace
                .from(SongBlueprint)
                .where({ id: [1, 2], namespace: "dev", artistId: 2 })
                .get();

            // assert
            expect(loadById).toHaveBeenCalledTimes(0);
            expect(loadByIds).toHaveBeenCalledTimes(1);
        });
    });
});
