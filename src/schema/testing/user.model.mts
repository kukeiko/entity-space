import { EntityBlueprint } from "../entity-blueprint.mjs";
import { RecordMetadataBlueprint } from "./record-metadata.model.mjs";

const { register, id, string, entity } = EntityBlueprint;

export class UserBlueprint {
    id = id();
    name = string();
    metadata = entity(RecordMetadataBlueprint);
}

register(UserBlueprint, { name: "user" });

export type User = EntityBlueprint.Instance<UserBlueprint>;
