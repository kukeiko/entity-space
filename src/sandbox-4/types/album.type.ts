import { TypeBuilder, EntityType } from "../type";
import { ArtistType } from "./artist.type";

export class AlbumType extends EntityType {
    getProperties() {
        return {
            artist: new TypeBuilder().addReference("artist", new ArtistType()).build().artist
        };
    }
    // artist = new TypeBuilder().addReference("artist", new Artist()).build().artist;
}

