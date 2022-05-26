import { ArraySchema, EntitySchema, IEntitySchema } from "@entity-space/core";

export class MusicSchemaCatalog {
    constructor() {
        const songSchema = new EntitySchema("song");
        songSchema.setKey("id");

        const songLocationSchema = new EntitySchema("song-location");
        songLocationSchema.setKey("id");
        songLocationSchema.addIndex("songId");

        songSchema.addProperty("locations", new ArraySchema(songLocationSchema));
        songSchema.addRelation("locations", "id", "songId");

        this.songSchema = songSchema;
        this.songLocationSchema = songLocationSchema;
    }

    private readonly songSchema: IEntitySchema;
    private readonly songLocationSchema: IEntitySchema;

    getSongSchema(): IEntitySchema {
        return this.songSchema;
    }

    getSongLocationSchema(): IEntitySchema {
        return this.songLocationSchema;
    }
}
