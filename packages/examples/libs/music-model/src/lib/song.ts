import { Blueprint, define, BlueprintInstance, MetadataReference } from "@entity-space/core";
import { ArtistBlueprint } from "./artist";
import { SongLocation } from "./song-location";

@Blueprint({ id: "song" })
export class SongBlueprint {
    id = define(Number, { id: true, required: true });
    name = define(String, { required: true });
    duration = define(Number, { required: true });
    artistId = define(Number, { index: true, required: true });
    artist = define(ArtistBlueprint, { relation: true, from: "artistId", to: "id" });
    locations = define({ $ref: "song-location" } as MetadataReference<SongLocation>, {
        array: true,
        relation: true,
        from: "id",
        to: "songId",
    });
    // [todo] not yet used, need to implement discriminated unions first
    // locations = define([LocalSongLocationBlueprint, WebSongLocationBlueprint], {
    //     array: true,
    //     relation: true,
    //     from: "id",
    //     to: "songId",
    // });
}

export type Song = BlueprintInstance<SongBlueprint>;
