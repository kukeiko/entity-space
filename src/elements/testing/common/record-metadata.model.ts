import { EntityBlueprint } from "../../entity/entity-blueprint";
import { UserBlueprint } from "./user.model";

const { register, number, entity, string, nullable } = EntityBlueprint;

export class RecordMetadataBlueprint {
    createdAt = string();
    createdById = number();
    createdBy = entity(UserBlueprint, this.createdById, user => user.id);
    updatedAt = string({ nullable });
    updatedById = number({ nullable });
    updatedBy = entity(UserBlueprint, this.updatedById, user => user.id, { nullable });
}

register(RecordMetadataBlueprint, { name: "record-metadata" });

export type RecordMetadata = EntityBlueprint.Instance<RecordMetadataBlueprint>;
