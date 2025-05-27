import { EntityBlueprint } from "../entity/entity-blueprint";
import { UserBlueprint } from "./user.model";

const { register, number, entity, string, optional, nullable } = EntityBlueprint;

export class RecordMetadataBlueprint {
    createdAt = string();
    createdById = number();
    createdBy = entity(UserBlueprint, this.createdById, user => user.id, { optional });
    updatedAt = string({ optional, nullable });
    updatedById = number({ optional, nullable });
    updatedBy = entity(UserBlueprint, this.updatedById, user => user.id, { optional, nullable });
}

register(RecordMetadataBlueprint, { name: "record-metadata" });

export type RecordMetadata = EntityBlueprint.Instance<RecordMetadataBlueprint>;
