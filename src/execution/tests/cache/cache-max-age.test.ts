import { Artist, ArtistBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";

// [todo] 🧪 add test that verifies that old cached queries are replaced by newer ones
// [todo] 🧪 add tests using relations
describe("cache max age", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("should make new request if cache is too old", async () => {
        // arrange
        const artists: Artist[] = [
            workspace.from(ArtistBlueprint).construct({ id: 1 }),
            workspace.from(ArtistBlueprint).construct({ id: 2 }),
        ];

        const loadArtists = repository.useMusic().useLoadAllArtists();
        repository.useMusic().useEntities({ artists });

        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        vi.useFakeTimers({ now: fiveMinutesAgo });
        await workspace.from(ArtistBlueprint).cache(true).get();

        // act
        vi.useRealTimers();

        await workspace
            .from(ArtistBlueprint)
            .cache({ maxAge: 3 * 60 })
            .get();

        // assert
        expect(loadArtists).toHaveBeenCalledTimes(2);
    });

    it("should make partial request if cache is partially too old", async () => {
        // arrange
        const artists: Artist[] = [
            workspace.from(ArtistBlueprint).construct({ id: 1 }),
            workspace.from(ArtistBlueprint).construct({ id: 2 }),
        ];

        const loadArtistsById = repository.useMusic().useLoadArtistById();
        repository.useMusic().useEntities({ artists });

        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

        vi.useFakeTimers({ now: tenMinutesAgo });
        await workspace.from(ArtistBlueprint).where({ id: 1 }).cache(true).get();

        vi.setSystemTime(fiveMinutesAgo);
        await workspace.from(ArtistBlueprint).where({ id: 2 }).cache(true).get();

        // act
        vi.useRealTimers();

        await workspace
            .from(ArtistBlueprint)
            .where({ id: [1, 2] })
            .cache({ maxAge: 6 * 60 })
            .get();

        // assert
        expect(loadArtistsById).toHaveBeenCalledTimes(3);
        expect(loadArtistsById).toHaveBeenNthCalledWith(1, 1);
        expect(loadArtistsById).toHaveBeenNthCalledWith(2, 2);
        expect(loadArtistsById).toHaveBeenNthCalledWith(3, 1);
    });

    it("should not make a request because cache is new enough", async () => {
        // arrange
        const artists: Artist[] = [
            workspace.from(ArtistBlueprint).construct({ id: 1 }),
            workspace.from(ArtistBlueprint).construct({ id: 2 }),
        ];

        const loadArtists = repository.useMusic().useLoadAllArtists();
        repository.useMusic().useEntities({ artists });

        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        vi.useFakeTimers({ now: fiveMinutesAgo });
        await workspace.from(ArtistBlueprint).cache(true).get();

        // act
        vi.useRealTimers();

        await workspace
            .from(ArtistBlueprint)
            .cache({ maxAge: 7 * 60 })
            .get();

        // assert
        expect(loadArtists).toHaveBeenCalledTimes(1);
    });
});
