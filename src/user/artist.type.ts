import { Type, Property } from "../sandbox";
import { UserType } from "./user.type";
import { AlbumType } from "./album.type";
import { CountryType } from "./country.type";

export interface ArtistType extends Type<"artist"> {
    globalId: Property.Id.Computed<"globalId", typeof String, ArtistType, "id" | "systemId">;
    id: Property.Primitive<"id", typeof Number, "Id", number>;
    name: Property.Primitive<"name", typeof String, "Name", string>;

    // systemId: Property.Primitive<"systemId", typeof Number, "SystemId", number, "n">;
    systemId: Property.Primitive.Computed<"systemId", typeof String, ArtistType, "systemName" | "systemZone">;

    systemName: Property.Primitive<"systemName", typeof String, "SystemName", string>;
    systemZone: Property.Primitive<"systemZone", typeof Number, "SystemZone", number>;

    numDigitsOfSystemId: Property.Primitive.Computed<"numDigitsOfSystemId", typeof Number, ArtistType, "systemId">;

    createdAt: Property.Primitive<"createdAt", typeof String, "CreatedAt", number>;
    createdById: Property.Reference.Id<"createdById", UserType, "id", "CreatedById">;
    createdBy: Property.Reference<"createdBy", UserType, ArtistType["createdById"], "CreatedBy">;

    changedAt: Property.Primitive<"changedAt", typeof String, "ChangedAt">;
    changedById: Property.Reference.Id<"changedById", UserType, "id", "ChangedById", "n" | "p">;
    changedBy: Property.Reference<"changedBy", UserType, ArtistType["changedById"], "ChangedBy", "n">;

    parentId: Property.Reference.Id<"parentId", ArtistType, "globalId", "ParentId", "n">;
    parent: Property.Reference<"parent", ArtistType, ArtistType["parentId"], "Parent", "n">;

    albums: Property.Children<"albums", AlbumType, "artistId", "Albums">;
    // children: Child<"children", ArtistType, "parent">;
    // albums: Child<"albums", AlbumType[], "artist">;

    countryId: Property.Reference.Id<"countryId", CountryType, "id", "CountryId", "n">;
    country: Property.Reference<"country", CountryType, ArtistType["countryId"], "Country", "n">;
    // countryId: Reference.Id<"countryId", CountryType , "id", "CountryId">;
    // country: Reference<"country", CountryType , ArtistType["countryId"], "Country">;

    lalala: 3;
    // reviewIds: Reference.Id<"reviewIds", ReviewType[] | null, "id", "ReviewIds">;
    // reviews: Reference<"reviews", (ReviewType | null)[] | null>;
}
