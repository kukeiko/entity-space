import { ArtistBlueprint, SongBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { TestFacade, TestRepository } from "../../testing";

describe("save() can cache entities", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("when creating 1x entity", async () => {
        // arrange
        const sunnexo = workspace.from(ArtistBlueprint).construct({ name: "Sunnexo" });
        repository.useMusic().useCreateArtist();
        const loadArtistByIdAndNamespace = repository.useMusic().useLoadArtistsByIdAndNamespace();

        // act
        await workspace.in(ArtistBlueprint).cache(true).save(sunnexo);

        await workspace
            .from(ArtistBlueprint)
            .where({ id: sunnexo.id, namespace: sunnexo.namespace })
            .cache(true)
            .getOne();

        // assert
        expect(loadArtistByIdAndNamespace).not.toHaveBeenCalled();
    });

    it("when updating 1x entity", async () => {
        // arrange
        const sunnexo = workspace.from(ArtistBlueprint).construct({ name: "Sunnexo", id: 2, namespace: "dev" });
        repository.useMusic().useUpdateArtist();
        const loadArtistByIdAndNamespace = repository.useMusic().useLoadArtistsByIdAndNamespace();

        // act
        await workspace.in(ArtistBlueprint).cache(true).save(sunnexo);

        await workspace
            .from(ArtistBlueprint)
            .where({ id: sunnexo.id, namespace: sunnexo.namespace })
            .cache(true)
            .getOne();

        // assert
        expect(loadArtistByIdAndNamespace).not.toHaveBeenCalled();
    });

    it("when deleting 1x entity", async () => {
        // arrange
        const sunnexo = workspace.from(ArtistBlueprint).construct({ name: "Sunnexo", id: 2, namespace: "dev" });
        repository.useMusic().useDeleteArtist();
        const loadArtistByIdAndNamespace = repository.useMusic().useLoadArtistsByIdAndNamespace();

        // act
        await workspace.in(ArtistBlueprint).cache(true).delete(sunnexo);

        const shouldBeEmpty = await workspace
            .from(ArtistBlueprint)
            .where({ id: sunnexo.id, namespace: sunnexo.namespace })
            .cache(true)
            .get();

        // assert
        expect(loadArtistByIdAndNamespace).not.toHaveBeenCalled();
        expect(shouldBeEmpty).toEqual([]);
    });

    it("when deleting 1x entity w/ inbound relations", async () => {
        // arrange
        const artists = [facade.construct(ArtistBlueprint, { name: "Sunnexo", id: 2, namespace: "dev" })];
        const songs = [facade.construct(SongBlueprint, { id: 20, namespace: "dev", artistId: 2 })];

        repository.useMusic().useEntities({ artists, songs });
        repository.useMusic().useDeleteArtistWithSongs();

        const loadArtistByIdAndNamespace = repository.useMusic().useLoadArtistsByIdAndNamespace();
        const loadSongsByArtistId = repository.useMusic().useLoadSongsByArtistId();

        // act
        const loaded = await workspace
            .from(ArtistBlueprint)
            .where({ id: 2, namespace: "dev" })
            .select({ songs: true })
            .cache(true)
            .get();

        await workspace.in(ArtistBlueprint).select({ songs: true }).cache(true).delete(loaded);

        const reloadedArtist = await workspace
            .from(ArtistBlueprint)
            .where({ id: 2, namespace: "dev" })
            .cache(true)
            .findOne();

        const reloadedSong = await workspace.from(SongBlueprint).where({ artistId: 2 }).cache(true).findOne();

        // assert
        expect(reloadedArtist).toEqual(undefined);
        expect(reloadedSong).toEqual(undefined);
        expect(loadArtistByIdAndNamespace).toHaveBeenCalledTimes(1);
        expect(loadSongsByArtistId).toHaveBeenCalledTimes(1);
    });
});
