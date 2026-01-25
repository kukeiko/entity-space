import { PackedEntitySelection } from "@entity-space/elements";
import { File, FileBlueprint, Folder, FolderBlueprint } from "@entity-space/elements/testing";
import { vi } from "vitest";
import { EntityServiceContainer } from "../../entity-service-container";
import { InMemoryRepository } from "./in-memory-repository";

type FileSystemEntities = {
    files: File[];
    folders: Folder[];
};

function filterById<T extends { id: string | number }>(id: string | number): (entity: T) => boolean {
    return entity => entity.id === id;
}

export class FileSystemRepository extends InMemoryRepository<FileSystemEntities> {
    constructor(services: EntityServiceContainer) {
        super();
        this.#services = services;
    }

    readonly #services: EntityServiceContainer;

    useLoadAllFolders() {
        const load = vi.fn(() => this.filter("folders"));

        this.#services.for(FolderBlueprint).addSource({
            load: () => load(),
        });

        return load;
    }

    useSaveFolders() {
        const save = vi.fn(
            ({ entities, selection }: { entities: Folder[]; selection: PackedEntitySelection<Folder> }) => {
                entities = structuredClone(entities);

                for (const entity of entities) {
                    entity.id = this.nextId("folders");
                    this.entities.folders = [...(this.entities.folders ?? []), entity as Folder];
                }

                return entities as Folder[];
            },
        );

        this.#services.for(FolderBlueprint).addSaveMutator({
            save,
        });

        return save;
    }

    useDeleteFolders() {
        const deleteFolders = vi.fn(
            ({ entities, selection }: { entities: Folder[]; selection: PackedEntitySelection<Folder> }) => {},
        );

        this.#services.for(FolderBlueprint).addDeleteMutator({
            delete: deleteFolders,
        });

        return deleteFolders;
    }

    useSaveFiles() {
        const save = vi.fn(({ entities, selection }: { entities: File[]; selection: PackedEntitySelection<File> }) => {
            entities = structuredClone(entities);

            // for (const entity of entities) {
            //     entity.id = this.#nextId("trees");
            //     entity.metadata = createMetadata(createdById, undefined, createdAt);

            //     // [todo] ❌ commented out to remind myself of: add validation to entities returned from user mutation functions
            //     // making sure entities are properly hydrated
            //     // item.updatedAt = null;
            // }

            return entities as File[];
        });

        this.#services.for(FileBlueprint).addSaveMutator({
            save,
        });

        return save;
    }

    useDeleteFiles() {
        const del = vi.fn(
            ({ entities, selection }: { entities: File[]; selection: PackedEntitySelection<File> }) => {},
        );

        this.#services.for(FileBlueprint).addDeleteMutator({
            delete: del,
        });

        return del;
    }
}
