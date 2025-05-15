import { EntityBlueprint } from "../entity-blueprint.mjs";
import { UserBlueprint } from "./user.model.mjs";

const { register, number, entity, string, optional } = EntityBlueprint;

export class RecordMetadataBlueprint {
    createdAt = string();
    createdById = number();
    createdBy = entity(UserBlueprint, this.createdById, user => user.id, { optional });
    updatedAt = string({ optional });
    updatedById = number({ optional });
    updatedBy = entity(UserBlueprint, this.updatedById, user => user.id, { optional });
}

register(RecordMetadataBlueprint, { name: "record-metadata" });

export type RecordMetadata = EntityBlueprint.Instance<RecordMetadataBlueprint>;
