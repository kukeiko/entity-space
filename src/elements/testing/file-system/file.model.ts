import { EntityBlueprint } from "../../entity/entity-blueprint";
import { RecordMetadataBlueprint } from "../record-metadata.model";
import { FolderBlueprint } from "./folder.model";

const { register, id, string, number, entity, readonly, optional } = EntityBlueprint;

export class FileBlueprint {
    id = id();
    name = string();
    folderId = number();
    folder = entity(FolderBlueprint, this.folderId, folder => folder.id, { optional });
    metadata = entity(RecordMetadataBlueprint);
}

register(FileBlueprint, { name: "files" });

export type File = EntityBlueprint.Instance<FileBlueprint>;
export type FileCreatable = EntityBlueprint.Creatable<FileBlueprint>;
export type FileUpdatable = EntityBlueprint.Updatable<FileBlueprint>;
export type FileSavable = EntityBlueprint.Savable<FileBlueprint>;
