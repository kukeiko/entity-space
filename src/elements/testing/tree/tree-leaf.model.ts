import { EntityBlueprint } from "../../entity/entity-blueprint";
import { RecordMetadataBlueprint } from "../record-metadata.model";

const { register, string, entity, readonly } = EntityBlueprint;

export class TreeLeafBlueprint {
    color = string();
    metadata = entity(RecordMetadataBlueprint);
}

register(TreeLeafBlueprint, { name: "tree-leaves" });

export type TreeLeaf = EntityBlueprint.Instance<TreeLeafBlueprint>;
