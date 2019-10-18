import { AlbumType } from "./album.type";
import { StringProperty, ReferenceProperty, PropertyBase } from "../property";
import { Instance, RequiredPropertyKeys, OptionalPropertyKeys, OptionalInstance, RequiredInstance, RequiredCreatableInstance, CreatableInstance, OptionalCreatableInstance, OptionalCreatablePropertyKeys, PropertyIsCreatable, RequiredCreatablePropertyKeys } from "../instance";
import { UserType } from "./user.type";

export class ArtistType {
    album = new ReferenceProperty("album", new AlbumType(), true, ["creatable"]);
    name = new StringProperty("name", false, ["creatable", "patchable"]);
    createdBy = new ReferenceProperty("createdBy", new UserType(), false, ["creatable"]);
    updatedBy = new ReferenceProperty("updatedBy", new UserType(), true, ["creatable", "patchable"]);
}

type NameCreatable = ArtistType["name"]["creatable"];
type NamePatchable = ArtistType["name"]["patchable"];
type NameUnique = ArtistType["name"]["unique"];

type Foo = Exclude<(typeof ArtistType["prototype"]["album"]), undefined>["read"];
// type Bar = (typeof ArtistType["prototype"]["name"]) extends PropertyBase<any, any, infer X> ? true : false;
type Bar = "u" extends "u" | "a" ? true : false;

type RequiredArtistTypePropertyKeys = RequiredPropertyKeys<ArtistType>;
type OptionalArtistTypePropertyKeys = OptionalPropertyKeys<ArtistType>;
type RequiredArtistTypeInstance = RequiredInstance<ArtistType>;
type RequiredCreatableArtistTypeInstance = RequiredCreatableInstance<ArtistType>;
type OptionalArtistTypeInstance = OptionalInstance<ArtistType>;
type ArtistTypeInstance = Instance<ArtistType>;
type OptionalCreatableArtistProperyKeys = OptionalCreatablePropertyKeys<ArtistType>;
type OptionalCreatableArtistInstance = OptionalCreatableInstance<ArtistType>;
type RequiredCreatableArtistPropertyKeys = RequiredCreatablePropertyKeys<ArtistType>;
type RequiredCreatableArtistInstance = RequiredCreatableInstance<ArtistType>;
type CreatableArtistInstance = CreatableInstance<ArtistType>;


type Foo123 = PropertyIsCreatable<ArtistType["album"]>;
type Foo124 = PropertyIsCreatable<ArtistType["createdBy"]>;
type ASdasd = true extends PropertyIsCreatable<ArtistType["updatedBy"]> ? true : false;

let foo: CreatableArtistInstance = {
    album: null,
    name: "foo",
    updatedBy: null,
    createdBy: {
        password: "123",
        username: "larifari"
    }
};

// let foo = new ArtistType().album.read({ album: { artist: { album: null, name: "foo" }, name: "foo" } }) ?.artist.album?.artist;

let artistInstance: Instance<ArtistType> = {
    name: "susi sonne",
    createdBy: {
        username: "asdas",
        password: "123"
    },
    updatedBy: null,
    // updatedBy: null,
    album: {
        artist: {
            album: null,
            name: "fdoo",
            createdBy: {
                username: "asdas",
                password: "123"
            },
            updatedBy: null
        },
        name: "foo",
        createdBy: {
            username: "susi",
            password: "123"
        },
        updatedBy: null
    }
};

let mix = {
    artist: new AlbumType().artist
};

let mixInstance: Instance<typeof mix> = {
    artist: {
        updatedBy: null,
        album: null,
        createdBy: {
            username: "foo",
            password: "123"
        },
        name: "foo"
    }
};
