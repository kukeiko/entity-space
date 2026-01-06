import { ArtistBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";

describe("hydration dispatch", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("user hydrators have higher piority than the auto join hydrator", async () => {
        // arrange
        const hydrate = vi.fn(() => undefined);

        repository.useMusic().useLoadAllArtists();
        repository.useMusic().useLoadSongsByArtistId();
        facade
            .getServices()
            .for(ArtistBlueprint)
            .addHydrator({
                requires: { id: true },
                select: { songs: true },
                hydrate,
            });

        // act
        await workspace.from(ArtistBlueprint).select({ songs: true }).get();

        // assert
        expect(hydrate).toHaveBeenCalledTimes(1);
    });
});
