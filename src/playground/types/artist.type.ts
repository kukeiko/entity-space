import { Type, Property } from "@sandbox";
import { UserType } from "./user.type";
import { AlbumType } from "./album.type";
import { CountryType } from "./country.type";
import { MetadataMixin } from "./metadata.mixin";

export interface ArtistType extends Type<"artist">, MetadataMixin {
    id: Property.Id.Computed<"id", typeof String, ArtistType, "systemArtistId" | "systemId">;
    systemArtistId: Property.Primitive<"systemArtistId", typeof Number, never, "Id", number>;
    name: Property.Primitive<"name", typeof String, never, "Name", string>;
    systemId: Property.Primitive.Computed<"systemId", typeof String, ArtistType, "systemName" | "systemZone">;
    systemName: Property.Primitive.Ethereal<"systemName", typeof String, "n">;
    systemZone: Property.Primitive.Ethereal<"systemZone", typeof Number>;
    // x: Property.Component
    // systemId: Property.Primitive<"systemId", typeof Number, "SystemId", number, "n">;

    numDigitsOfSystemId: Property.Primitive.Computed<"numDigitsOfSystemId", typeof Number, ArtistType, "systemId", "n">;

    parentId: Property.Reference.Id.Computed<"parentId", ArtistType, "id", ArtistType, "systemArtistId" | "systemId", "n">;
    // parentId: Property.Reference.Id<"parentId", ArtistType, "id", "ParentId", "n">;
    parent: Property.Reference<"parent", ArtistType, ArtistType["parentId"], "n", "Parent">;

    albums: Property.Children<"albums", AlbumType, "artistId", never, "Albums">;
    // children: Child<"children", ArtistType, "parent">;
    // albums: Child<"albums", AlbumType[], "artist">;

    countryId: Property.Reference.Id<"countryId", CountryType, "id", "n", "CountryId">;
    country: Property.Reference<"country", CountryType, ArtistType["countryId"], "n", "Country">;
    // countryId: Reference.Id<"countryId", CountryType , "id", "CountryId">;
    // country: Reference<"country", CountryType , ArtistType["countryId"], "Country">;

    lalala: 3;
    reviewIds: Property.Primitive.Array<"reviewIds", typeof Number, never, "ReviewIds">;
    // reviewIds: Reference.Id<"reviewIds", ReviewType[] | null, "id", "ReviewIds">;
    // reviews: Reference<"reviews", (ReviewType | null)[] | null>;
}
