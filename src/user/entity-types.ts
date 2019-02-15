import { Type, Property } from "../sandbox";

export interface UserType extends Type<"user"> {
    id: Property.Id<"id", typeof Number, "Id">;
    name: Property.Primitive<"name", typeof String, "Name", string, "n">;

    createdById: Property.Reference.Id<"createdById", UserType, "id", "CreatedById", "n">;
    createdBy: Property.Reference<"createdBy", UserType, UserType["createdById"], "CreatedBy", "n">;

    changedAt: Property.Primitive<"changedAt", typeof String, "ChangedAt">;
    changedById: Property.Reference.Id<"changedById", UserType, "id", "ChangedById", "n">;
    changedBy: Property.Reference<"changedBy", UserType, UserType["changedById"], "ChangedBy", "n">;
}

export interface CountryType extends Type<"country"> {
    id: Property.Id<"id", typeof String>;
    name: Property.Primitive<"name", typeof String, "Name">;
    population: Property.Primitive<"population", typeof Number, "Population">;

    createdById: Property.Reference.Id<"createdById", UserType, "id", "CreatedById">;
    createdBy: Property.Reference<"createdBy", UserType, CountryType["createdById"], "CreatedBy">;

    changedAt: Property.Primitive<"changedAt", typeof String, "ChangedAt">;
    changedById: Property.Reference.Id<"changedById", UserType, "id", "ChangedById", "n">;
    changedBy: Property.Reference<"changedBy", UserType, CountryType["changedById"], "ChangedBy", "n">;
}

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

export interface AlbumType extends Type<"album"> {
    id: Property.Id<"id", typeof Number, "Id">;
    artistId: Property.Reference.Id<"artistId", ArtistType, "globalId", "ArtistId", "n" | "p" | "c">;
    artist: Property.Reference<"artist", ArtistType, AlbumType["artistId"], "Artist", "n" | "p" | "c">;
}

export interface ReviewType extends Type<"review"> {
    id: Property.Id<"id", typeof Number>;
}
