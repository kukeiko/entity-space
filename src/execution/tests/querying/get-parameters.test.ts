import { EntityBlueprint } from "@entity-space/elements";
import { Song, SongBlueprint, User, UserBlueprint, UserRequestBlueprint } from "@entity-space/elements/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EntityWorkspace } from "../../entity-workspace";
import { HydrateEntitiesFn } from "../../hydration/entity-hydrator";
import { LoadEntitiesFn } from "../../sourcing/entity-source";
import { TestFacade, TestRepository } from "../../testing";

describe("get()", () => {
    let facade: TestFacade;
    let repository: TestRepository;
    let workspace: EntityWorkspace;

    beforeEach(() => {
        facade = new TestFacade();
        repository = facade.getTestRepository();
        workspace = facade.getWorkspace();
    });

    it("exact order and identity of entities returned by source is kept when querying by parameters", async () => {
        /**
         * arrange
         *
         * we set up three users: "Susi Sonne" and "Mara Mauzi" which will be returned by the request, where "Dana Dandy" will be hydrated
         * as the metadata.createdBy user. Because all are of type "User", they all end up in the same EntityStore during the first load call.
         * When we then request again (which will load from cache), we want to make sure that "Dana Dandy" is not suddenly part of the returned result,
         * it should still only exist as metadata.createdBy.user on "Susi Sonne" and "Mara Mauzi".
         *
         * Testing that the order being kept is done by having "Susi Sonne" be before "Mara Mauzi",
         * which is different to what the default sorter of "User" is set to as it orders names ascending.
         */
        const users: User[] = [
            {
                id: 1,
                name: "Susi Sonne",
                metadata: { createdById: 3, createdAt: new Date().toISOString(), updatedAt: null, updatedById: null },
            },
            {
                id: 2,
                name: "Mara Mauzi",
                metadata: { createdById: 3, createdAt: new Date().toISOString(), updatedAt: null, updatedById: null },
            },
            {
                id: 3,
                name: "Dana Dandy",
                metadata: { createdById: 0, createdAt: new Date().toISOString(), updatedAt: null, updatedById: null },
            },
        ];

        const expected = users
            .slice(0, 2)
            .map(user => ({ ...user, metadata: { ...user.metadata, createdBy: users[2] } }));

        const load = () =>
            workspace
                .from(UserBlueprint)
                .use(UserRequestBlueprint, { page: 0, pageSize: 2 })
                .select({ metadata: { createdBy: true } })
                .cache(true)
                .get();

        repository.useCommon().useEntities({ users });
        repository.useCommon().useLoadUsersByRequest();
        repository.useCommon().useLoadUserById();

        // act
        const loadedFromSource = await load();
        const loadedFromCache = await load();

        // assert
        expect(loadedFromCache).toStrictEqual(expected);
        expect(loadedFromCache).toStrictEqual(loadedFromSource);
    });

    it("should forward parameters to explicit hydrators", async () => {
        // arrange
        const { register, string } = EntityBlueprint;

        class SongRequestBlueprint {
            language = string();
        }

        register(SongRequestBlueprint);

        const load = vi.fn<LoadEntitiesFn<SongBlueprint>>(() => {
            const songs: Song[] = [facade.getWorkspace().from(SongBlueprint).constructDefault()];
            return songs;
        });

        const hydrate = vi.fn<HydrateEntitiesFn<SongBlueprint>>(() => {});

        facade
            .getServices()
            .for(SongBlueprint)
            .addHydrator({
                parameters: SongRequestBlueprint,
                requires: {},
                select: { artist: true },
                hydrate,
            })
            .addSource({ parameters: SongRequestBlueprint, load });

        // act
        await workspace
            .from(SongBlueprint)
            .use(SongRequestBlueprint, { language: "bisaya" })
            .select({ artist: true })
            .get();

        // assert
        expect(load).toHaveBeenCalledTimes(1);
        expect(hydrate).toHaveBeenCalledTimes(1);
        expect(hydrate).toHaveBeenCalledWith({
            context: expect.any(Object),
            selection: expect.any(Object),
            entities: expect.any(Object),
            parameters: {
                language: "bisaya",
            },
        });
    });
});
