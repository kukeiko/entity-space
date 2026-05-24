import { User, UserBlueprint, UserRequest, UserRequestBlueprint } from "@entity-space/elements/testing";
import { vi } from "vitest";
import { EntityServiceContainer } from "../../entity-service-container";
import { HydrateEntitiesFn } from "../../hydration/entity-hydrator";
import { DeleteEntitiesFn, SaveEntitiesFn } from "../../mutation/entity-mutation-function.type";
import { LoadEntitiesSort } from "../../sourcing/entity-source";
import { InMemoryRepository } from "./in-memory-repository";

type CommonEntities = {
    users: User[];
};

function filterById<T extends { id: string | number }>(id: string | number): (entity: T) => boolean {
    return entity => entity.id === id;
}

export class CommonRepository extends InMemoryRepository<CommonEntities> {
    constructor(services: EntityServiceContainer) {
        super();
        this.#services = services;
    }

    readonly #services: EntityServiceContainer;

    useLoadAllUsers() {
        const load = vi.fn(() => this.filter("users"));

        this.#services.for(UserBlueprint).addSource({
            select: { metadata: { updatedAt: true, updatedById: true } },
            load: () => load(),
        });

        return load;
    }

    useLoadPagedUsers() {
        const load = vi.fn((from?: number, to?: number, sort?: LoadEntitiesSort[]) =>
            this.filter("users", undefined, from, to, sort),
        );

        this.#services.for(UserBlueprint).addSource({
            select: {},
            sortable: {
                name: true,
                metadata: {
                    updatedAt: true,
                },
            },
            paging: true,
            load: ({ page, sort }) => load(page?.from, page?.to, sort),
        });

        return load;
    }

    useLoadUserById() {
        const load = vi.fn((id: number) => this.filter("users", filterById(id)));

        this.#services.for(UserBlueprint).addSource({
            where: { id: { $equals: true } },
            load: ({ criteria: { id } }) => load(id.value),
        });

        return load;
    }

    useLoadUsersByRequest() {
        const load = vi.fn((parameters: UserRequest) => {
            const page = parameters.page ?? 0;
            const pageSize = parameters.pageSize ?? 3;
            const from = page * pageSize;
            const to = (page + 1) * pageSize;

            return this.filter("users", undefined, from, to);
        });

        this.#services.for(UserBlueprint).addSource({
            parameters: UserRequestBlueprint,
            load: ({ parameters }) => load(parameters),
        });

        return load;
    }

    useHydrateUserCreatedByName() {
        const hydrate = vi.fn<HydrateEntitiesFn<UserBlueprint>>(({ entities }) => {
            entities.forEach(user => (user.createdByName = user.metadata.createdBy!.name));
        });

        this.#services.for(UserBlueprint).addHydrator({
            select: { createdByName: true },
            requires: { metadata: { createdBy: true } },
            hydrate,
        });

        return hydrate;
    }

    useSaveUsers() {
        const save = vi.fn<SaveEntitiesFn<UserBlueprint>>(({ entities }) => {
            entities = structuredClone(entities);

            for (const entity of entities) {
                entity.id = this.nextId("users");
            }

            return entities;
        });

        this.#services.for(UserBlueprint).addSaveMutator({ save });

        return save;
    }

    useDeleteUsers() {
        const del = vi.fn<DeleteEntitiesFn<UserBlueprint>>(() => {});
        this.#services.for(UserBlueprint).addDeleteMutator({ delete: del });

        return del;
    }
}
