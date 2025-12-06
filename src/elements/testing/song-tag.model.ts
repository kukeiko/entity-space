import { EntityBlueprint } from "../entity/entity-blueprint";

const { register, id } = EntityBlueprint;

export class SongTagBlueprint {
    songId = id();
    tagId = id(String);
}

register(SongTagBlueprint, { name: "son-tag" });

export type SongTag = EntityBlueprint.Instance<SongTagBlueprint>;
