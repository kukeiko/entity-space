import { EntityBlueprint } from "../../entity/entity-blueprint";
import { RecordMetadataBlueprint } from "../common/record-metadata.model";

const { register, string, entity } = EntityBlueprint;

export class TreeLeafBlueprint {
    color = string();
    metadata = entity(RecordMetadataBlueprint);
}

register(TreeLeafBlueprint, { name: "tree-leaves" });

export type TreeLeaf = EntityBlueprint.Type<TreeLeafBlueprint>;
