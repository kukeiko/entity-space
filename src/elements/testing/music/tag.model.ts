import { EntityBlueprint } from "../../entity/entity-blueprint";
import { SongBlueprint } from "./song.model";

const { register, id, string, entity, optional, array } = EntityBlueprint;

export class TagBlueprint {
    id = id(String);
    name = string();
    description = string({ optional });
    similar = string({ array });
    songs = entity(SongBlueprint, this.id, other => other.tagIds, { array });
}

register(TagBlueprint, { name: "tags" });

export type Tag = EntityBlueprint.Type<TagBlueprint>;
