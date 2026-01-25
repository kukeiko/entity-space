import { File, FileBlueprint, Folder, FolderBlueprint } from "@entity-space/elements/testing";
import { vi } from "vitest";
import { EntityServiceContainer } from "../../entity-service-container";
import { DeleteEntitiesFn, SaveEntitiesFn } from "../../mutation/entity-mutation-function.type";
import { InMemoryRepository } from "./in-memory-repository";

type FileSystemEntities = {
    files: File[];
    folders: Folder[];
};

export class FileSystemRepository extends InMemoryRepository<FileSystemEntities> {
    constructor(services: EntityServiceContainer) {
        super();
        this.#services = services;
    }

    readonly #services: EntityServiceContainer;

    useLoadAllFolders() {
        const load = vi.fn(() => this.filter("folders"));
        this.#services.for(FolderBlueprint).addSource({ load });

        return load;
    }

    useSaveFolders() {
        const save = vi.fn<SaveEntitiesFn<FolderBlueprint>>(({ entities }) => {
            entities = structuredClone(entities);

            for (const entity of entities) {
                entity.id = this.nextId("folders");
                this.entities.folders = [...(this.entities.folders ?? []), entity as Folder];
            }

            return entities as Folder[];
        });

        this.#services.for(FolderBlueprint).addSaveMutator({ save });

        return save;
    }

    useDeleteFolders() {
        const del = vi.fn<DeleteEntitiesFn<FolderBlueprint>>(() => {});
        this.#services.for(FolderBlueprint).addDeleteMutator({ delete: del });

        return del;
    }

    useSaveFiles() {
        const save = vi.fn<SaveEntitiesFn<FileBlueprint>>(({ entities }) => structuredClone(entities));
        this.#services.for(FileBlueprint).addSaveMutator({ save });

        return save;
    }

    useDeleteFiles() {
        const del = vi.fn<DeleteEntitiesFn<FileBlueprint>>(() => {});
        this.#services.for(FileBlueprint).addDeleteMutator({ delete: del });

        return del;
    }
}
