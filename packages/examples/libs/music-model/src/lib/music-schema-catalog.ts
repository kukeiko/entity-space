import { ArraySchema, EntitySchema, IEntitySchema } from "@entity-space/core";

export class MusicSchemaCatalog {
    constructor() {
        const artistSchema = new EntitySchema("artist");
        artistSchema.setKey("id");

        const songSchema = new EntitySchema("song");
        songSchema.setKey("id");
        songSchema.addIndex("artistId");
        songSchema.addProperty("artist", artistSchema);
        songSchema.addRelation("artist", "artistId", "id");

        const songLocationSchema = new EntitySchema("song-location");
        songLocationSchema.setKey("id");
        songLocationSchema.addIndex("songId");

        songSchema.addProperty("locations", new ArraySchema(songLocationSchema));
        songSchema.addRelation("locations", "id", "songId");

        this.artistSchema = artistSchema;
        this.songSchema = songSchema;
        this.songLocationSchema = songLocationSchema;
    }

    private readonly artistSchema: IEntitySchema;
    private readonly songSchema: IEntitySchema;
    private readonly songLocationSchema: IEntitySchema;

    getArtistSchema(): IEntitySchema {
        return this.artistSchema;
    }

    getSongSchema(): IEntitySchema {
        return this.songSchema;
    }

    getSongLocationSchema(): IEntitySchema {
        return this.songLocationSchema;
    }
}
