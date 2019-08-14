import { Type, Property } from "@sandbox";
import { UserType } from "./user.type";
import { AlbumType } from "./album.type";
import { CountryType } from "./country.type";
import { MetadataMixin } from "./metadata.mixin";

export interface ArtistType extends Type<"artist">, MetadataMixin {
    id: Property.Id<"id", typeof String, "Id">;
    name: Property.Primitive<"name", typeof String, never, "Name", string>;
    albums: Property.Children<"albums", AlbumType, "artistId", never, "Albums">;
    countryId: Property.Reference.Id<"countryId", CountryType, "id", "n", "CountryId">;
    country: Property.Reference<"country", CountryType, ArtistType["countryId"], "n", "Country">;
    reviewIds: Property.Primitive.Array<"reviewIds", typeof Number, never, "ReviewIds">;
    // reviewIds: Reference.Id<"reviewIds", ReviewType[] | null, "id", "ReviewIds">;
    // reviews: Reference<"reviews", (ReviewType | null)[] | null>;
}
