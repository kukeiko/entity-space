import { ArtistType } from "./artist.type";
import { StringProperty, ReferenceProperty } from "../property";
import { UserType } from "./user.type";

export class AlbumType {
    artist = new ReferenceProperty("artist", new ArtistType(), false, []);
    name = new StringProperty("name", false, ["patchable"]);
    createdBy = new ReferenceProperty("createdBy", new UserType(), false, []);
    updatedBy = new ReferenceProperty("updatedBy", new UserType(), true, []);
}
