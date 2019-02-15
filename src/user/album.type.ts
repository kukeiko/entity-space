import { Type, Property } from "../sandbox";
import { ArtistType } from "./artist.type";

export interface AlbumType extends Type<"album"> {
    id: Property.Id<"id", typeof Number, "Id">;
    artistId: Property.Reference.Id<"artistId", ArtistType, "globalId", "ArtistId", "n" | "p" | "c">;
    artist: Property.Reference<"artist", ArtistType, AlbumType["artistId"], "Artist", "n" | "p" | "c">;
}
