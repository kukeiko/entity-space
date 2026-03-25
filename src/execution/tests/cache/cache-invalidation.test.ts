import { Artist, ArtistBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";

describe("cache invalidation", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    describe("entity should be removed from cache after refreshing from source", () => {
        it("when the query has no criteria", async () => {
            // arrange
            const kept: Artist = { ...workspace.from(ArtistBlueprint).constructDefault(), id: 1, namespace: "dev" };
            const evicted: Artist = { ...workspace.from(ArtistBlueprint).constructDefault(), id: 2, namespace: "dev" };

            repository.useMusic().useEntities({ artists: [kept, evicted] });
            repository.useMusic().useLoadAllArtists();

            // act
            await workspace.from(ArtistBlueprint).cache(true).get();
            repository.useMusic().useEntities({ artists: [kept] });
            await workspace.from(ArtistBlueprint).cache({ refresh: true }).get();
            const actual = await workspace.from(ArtistBlueprint).cache(true).where({ id: evicted.id }).findOne();

            // assert
            expect(actual).toBeUndefined();
        });

        it("when criteria are only set on readonly properties", async () => {
            // arrange
            const kept: Artist = { ...workspace.from(ArtistBlueprint).constructDefault(), id: 1, namespace: "dev" };
            const evicted: Artist = { ...workspace.from(ArtistBlueprint).constructDefault(), id: 2, namespace: "dev" };

            repository.useMusic().useEntities({ artists: [kept, evicted] });
            repository.useMusic().useLoadArtistsByNamespace();

            // act
            await workspace.from(ArtistBlueprint).where({ namespace: "dev" }).cache(true).get();
            repository.useMusic().useEntities({ artists: [kept] });
            await workspace.from(ArtistBlueprint).where({ namespace: "dev" }).cache({ refresh: true }).get();
            const actual = await workspace
                .from(ArtistBlueprint)
                .cache(true)
                .where({ id: evicted.id, namespace: "dev" })
                .findOne();

            // assert
            expect(actual).toBeUndefined();
        });
    });
});
