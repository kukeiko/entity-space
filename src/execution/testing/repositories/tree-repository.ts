import { PackedEntitySelection } from "@entity-space/elements";
import { Tree, TreeBlueprint, TreeSavable, User } from "@entity-space/elements/testing";
import { vi } from "vitest";
import { EntityServiceContainer } from "../../entity-service-container";
import { InMemoryRepository } from "./in-memory-repository";

type TreeEntities = {
    trees: Tree[];
    users: User[];
};

function filterById<T extends { id: string | number }>(id: string | number): (entity: T) => boolean {
    return entity => entity.id === id;
}

export class TreeRepository extends InMemoryRepository<TreeEntities> {
    constructor(services: EntityServiceContainer) {
        super();
        this.#services = services;
    }

    readonly #services: EntityServiceContainer;

    useLoadAllTrees() {
        const load = vi.fn(() => this.filter("trees"));

        this.#services.for(TreeBlueprint).addSource({
            load: () => load(),
        });

        return load;
    }

    useLoadAllTreesWithFirstLevelBranchesMetadataCreatedBy() {
        const load = vi.fn(() => this.filter("trees"));

        this.#services.for(TreeBlueprint).addSource({
            load: ({ selection }) => {
                const trees = load();

                if (selection.branches?.metadata?.createdBy) {
                    for (const tree of trees) {
                        for (const branch of tree.branches) {
                            branch.metadata.createdBy = this.filter(
                                "users",
                                user => user.id === branch.metadata.createdById,
                            )[0];
                        }
                    }
                }

                return trees;
            },
            select: { branches: { metadata: { createdBy: true } } },
        });

        return load;
    }

    useSaveTrees() {
        const save = vi.fn(
            ({ entities, selection }: { entities: TreeSavable[]; selection: PackedEntitySelection<Tree> }) => {
                entities = structuredClone(entities);

                for (const entity of entities) {
                    entity.id = this.nextId("trees");
                }

                return entities as Tree[];
            },
        );

        this.#services.for(TreeBlueprint).addSaveMutator({
            save,
            select: {
                branches: {
                    branches: "*",
                },
            },
        });

        return save;
    }

    useDeleteTrees() {
        const deleteTrees = vi.fn(
            ({ entities, selection }: { entities: Tree[]; selection: PackedEntitySelection<Tree> }) => {},
        );

        this.#services.for(TreeBlueprint).addDeleteMutator({
            delete: deleteTrees,
        });

        return deleteTrees;
    }
}
