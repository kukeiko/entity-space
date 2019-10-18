import { TypeBuilder, EntityType } from "../type";
import { AlbumType } from "./album.type";

export class ArtistType extends EntityType {
    getProperties() {
        return {
            album: new TypeBuilder().addReference("album", new AlbumType()).build().album
        };
    }

    // album = new TypeBuilder().addReference("album", new Album()).build().album;
}
