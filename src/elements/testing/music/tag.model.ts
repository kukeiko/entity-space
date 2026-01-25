import { EntityBlueprint } from "../../entity/entity-blueprint";

const { register, id, string, optional } = EntityBlueprint;

export class TagBlueprint {
    id = id(String);
    name = string();
    description = string({ optional });
}

register(TagBlueprint, { name: "tag" });

export type Tag = EntityBlueprint.Type<TagBlueprint>;
