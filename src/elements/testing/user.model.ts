import { EntityBlueprint } from "../entity/entity-blueprint";
import { RecordMetadataBlueprint } from "./record-metadata.model";

const { register, id, string, entity } = EntityBlueprint;

export class UserBlueprint {
    id = id();
    name = string();
    metadata = entity(RecordMetadataBlueprint);
}

register(UserBlueprint, { name: "user", sort: (a, b) => a.name.localeCompare(b.name) });

export type User = EntityBlueprint.Instance<UserBlueprint>;
