import { Blueprint, BlueprintInstance, define, EntitySchema } from "@entity-space/core";
import { SongBlueprint } from "./song";

export interface BaseSongLocation {
    id: number;
    songId: number;
    song?: BlueprintInstance<SongBlueprint>;
}

export interface WebSongLocation extends BaseSongLocation {
    url: string;
    songLocationType: "web";
}

export interface LocalSongLocation extends BaseSongLocation {
    path: string;
    songLocationType: "local";
}

export type SongLocation = LocalSongLocation | WebSongLocation;

@Blueprint({ id: "song-location-type" })
export class SongLocationTypeBlueprint {
    id = define(String, { id: true, required: true });
    name = define(String, { required: true });
}

export type SongLocationType = BlueprintInstance<SongLocationTypeBlueprint>;

// [todo] not yet used, need to implement discriminated unions first
export abstract class BaseSongLocationBlueprint {
    id = define(Number, { id: true, required: true });
    songId = define(Number, { required: true, index: true });
}

// [todo] not yet used, need to implement discriminated unions first
@Blueprint({ id: "web-song-location" })
export class WebSongLocationBlueprint extends BaseSongLocationBlueprint {
    url = define(String, { required: true });
    songLocationType = define("web", { discriminator: true, required: true });
}

// [todo] not yet used, need to implement discriminated unions first
@Blueprint({ id: "local-song-location" })
export class LocalSongLocationBlueprint extends BaseSongLocationBlueprint {
    path = define(String, { required: true });
    songLocationType = define("local", { discriminator: true, required: true });
}

export class SongLocationEntitySchema extends EntitySchema {
    constructor() {
        super("song-location");
        this.setKey("id")
            .addIndex("songId")
            .addInteger("id", true) // [todo] making key required should be done automatically
            .addInteger("songId", true)
            .addString("url")
            .addString("path")
            .addString("songLocationType", true);
    }
}
