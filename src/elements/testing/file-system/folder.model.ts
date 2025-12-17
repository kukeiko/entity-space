import { EntityBlueprint } from "../../entity/entity-blueprint";
import { RecordMetadataBlueprint } from "../common/record-metadata.model";
import { FileBlueprint } from "./file.model";

const { register, id, number, string, entity, array, nullable } = EntityBlueprint;

/**
 * Used to test recursive joined relations.
 */
export class FolderBlueprint {
    id = id();
    name = string();
    parentId = number({ nullable });
    parent = entity(FolderBlueprint, this.parentId, folder => folder.id, { nullable });
    folders = entity(FolderBlueprint, this.id, folder => folder.parentId, { array });
    files = entity(FileBlueprint, this.id, file => file.folderId, { array });
    metadata = entity(RecordMetadataBlueprint);
}

register(FolderBlueprint, { name: "folders" });

export type Folder = EntityBlueprint.Instance<FolderBlueprint>;
export type FolderCreatable = EntityBlueprint.Creatable<FolderBlueprint>;
export type FolderUpdatable = EntityBlueprint.Updatable<FolderBlueprint>;
export type FolderSavable = EntityBlueprint.Savable<FolderBlueprint>;