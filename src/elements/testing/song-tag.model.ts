import { EntityBlueprint } from "../entity/entity-blueprint";
import { SongBlueprint } from "./song.model";

const { register, id, entity, creatable, array, optional } = EntityBlueprint;

export class SongTagBlueprint {
    songId = id({ creatable });
    tagId = id(String, { creatable });
    songs = entity(SongBlueprint, this.songId, song => song.id, { array, optional });
}

register(SongTagBlueprint, { name: "song-tag" });

export type SongTag = EntityBlueprint.Instance<SongTagBlueprint>;
