import { Property } from "./property";
import { Instance } from "./instance";
import { Local, Complex, Id, Reference, Child, Navigable } from "./properties";
import { Box } from "./lang";
import { DomainBuilder } from "./domain-builder";
import { Type } from "./type";

/**
 *    ██╗   ██╗███████╗███████╗██████╗     ████████╗██╗   ██╗██████╗ ███████╗███████╗
 *    ██║   ██║██╔════╝██╔════╝██╔══██╗    ╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔════╝
 *    ██║   ██║███████╗█████╗  ██████╔╝       ██║    ╚████╔╝ ██████╔╝█████╗  ███████╗
 *    ██║   ██║╚════██║██╔══╝  ██╔══██╗       ██║     ╚██╔╝  ██╔═══╝ ██╔══╝  ╚════██║
 *    ╚██████╔╝███████║███████╗██║  ██║       ██║      ██║   ██║     ███████╗███████║
 *     ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝       ╚═╝      ╚═╝   ╚═╝     ╚══════╝╚══════╝
 */

// [todo] think about supporting the different types of restrictions (e.g. EventNodeRestriction, which inherits from Restriction afaik)
interface BonusRestrictionType {
    key: Local<string, "key", "Key">;
    value: Local<string, "value", "Value">;
    // [todo] think about virtuals nao, wrote this comment to never forget
}

interface BonusRestrictionsPerCutPointType {
    "1": Complex<BonusRestrictionType[], "1">;
    "2": Complex<BonusRestrictionType[], "2">;
    "3": Complex<BonusRestrictionType[], "3">;
}

interface BonusAdditionalInfo {
    lari: Local<number, "lari">;
    fari: Local<string, "fari">;
}

interface BonusType {
    restrictions: Complex<BonusRestrictionsPerCutPointType, "restrictions", "Restrictions">;
    // additionalInfo: Local.Selectable<
}

module BonusType {
    export type BonusInstance = Instance<BonusType>;
    export type BonusDtoInstance = Instance.Dto<BonusType>;
}

interface UserType {
    id: Id.Computed<string, "id", UserType, "userId" | "systemId", "Id">;
    name: Local<string, "name", "Name">;
    systemId: Local<number, "systemId", "SystemId">;
    userId: Local<number, "userId", "UserId">;
}

interface CountryType extends Type<"country"> {
    id: Id<string, "id", "Id">;
    fooId: Id<string, "fooId", "FooId">;
    name: Local<string, "name", "Name">;
    createdById: Reference.Id<UserType, "createdById", "id", "CreatedById">;
    createdBy: Reference<UserType, "createdBy", CountryType["createdById"], "CreatedBy">;
}

interface ArtistType extends Type<"artist"> {
    id: Id<number, "id", "Id", string>;
    bornAt: Local.Creatable<Date, "bornAt", "BornAt", number>;
    bornInId: Reference.Id.Creatable<CountryType, "bornInId", "id", "BornInId">;
    diedAt: Local<Date | null, "diedAt", "DiedAt", number | null>;
    name: Local<string, "name", "Name">;
    albums: Child<AlbumType[], "albums", "artist", "Albums">;
    // countryId: Reference.Key<CountryType, "countryId", "id", "CountryId">;
    countryId: Reference.Id.Patchable<CountryType, "countryId", "id", "CountryId">;
    country: Reference<CountryType, "country", ArtistType["countryId"], "Country">;
    reviewIds: Reference.Id<ReviewType[], "reviewIds", "id">;
    reviews: Reference.Virtual<ReviewType[], "reviews", ArtistType["reviewIds"]>;
    metadata: Complex<Metadata, "metadata", "Metadata">;
}

type alkdasd = Property.Keys<ArtistType>;
type ArtistTypeDto = Instance.Dto<ArtistType>;
type blarb = ArtistType["reviews"]["navigated"]
type DtoValue = Property.Dto.ValueType<ArtistType["bornAt"]>;

interface Metadata extends Type<"metadata"> {
    createdAt: Local<Date, "createdAt", "CreatedAt", number>;
    updatedAt: Local<Date | null, "updatedAt", "UpdatedAt", number | null>;
    // creatorId: Reference.Id<
}

type A = { a: "a"; };

module A {
    export type Lala = 3;

    export module Lala {
        export type Foo = 123;
    }
}

type B = { b: "b"; };

type AB = A & B & A.Lala;

type Lari = AB extends A.Lala ? true : false;

// type Foo = Box<Property.ValueType<Property.WithKey<U, P>>;
// type Foo = Property.ValueType<Property.WithKey<CountryType, "id">>;
// type Foo = ArtistType["countryId"] extends Reference.Key<infer A, infer B, infer C, infer D, infer E, infer F> ? true : false;
type Foo = ArtistType["country"] extends Reference<any, any, any, any> ? true : false;
type Khaz = ArtistType["countryId"] extends Reference.Id.Creatable<any, any, any, any, any, any> ? true : false;
type ArtistCreatableKeys = Local.Creatable.Keys<ArtistType>;
type ArtistCreatableReferenceKeys = Reference.Id.Creatable.Keys<ArtistType>;
type ArtistPatchableReferenceKeys = Reference.Id.Patchable.Keys<ArtistType>;

// [stopped at] thinking on what type the Collection.Key should be
interface AlbumType extends Type<"album"> {
    id: Id<string, "id", "Id">;
    // [todo] test "undefined" via a query "expandIf()"
    artistId: Reference.Id<ArtistType, "artistId", "id", "ArtistId">;
    artist: Reference<ArtistType, "artist", AlbumType["artistId"], "Artist">;
    // artist: Navigable<ArtistType, "artist", "Artist">;
    publishedAt: Local<Date, "publishedAt", "PublishedAt", string>;
    // tags: External<TagType[], "tags", "id", "Tags">;
    updatedAt: Local<Date, "updatedAt", "UpdatedAt", string>;
    reviewIds: Reference.Id<ReviewType[], "reviewIds", "id">;
    reviews: Reference.Virtual<ReviewType[], "reviews", AlbumType["reviewIds"]>;
    // reviews: Collection<Review, "reviews", AlbumType["reviewIds"]>;
    songs: Child<SongType[], "songs", "album", "Songs">;
    comments: Local<string[], "comments">;
}

export module AlbumType {
    export const keys = Type.createKeys<AlbumType>({
        artist: "artist",
        artistId: "artistId",
        id: "id",
        publishedAt: "publishedAt",
        reviewIds: "reviewIds",
        reviews: "reviews",
        songs: "songs",
        updatedAt: "updatedAt",
        comments: "comments"
    });
}

type Quakli = Reference.Id.Keys<AlbumType>;

interface ReviewType {
    id: Id<string, "id", "Id">;
    text: Local<string, "text", "Text">;
}

enum ArtistKeys {
    Name = "name"
}

type alsd = Instance<ArtistType>;
type larifari = DomainBuilder.TypeConstructionOptions<ArtistType, "artist">;
type queqwe = Property.Keys<ArtistType>;

// [stopped at] thinking on how the domainbuilder identifies each property,
// as it will have to autofill quite a lot on its own (like e.g. reference)
let domainBuilder = new DomainBuilder()
    .add<ArtistType, Type.NameOf<ArtistType>>({
        $: {
            name: "artist"
        },
        id: {
            dtoName: "Id",
            fromDto: x => +x,
            toDto: x => x.toString(),
            type: "id"
        },
        bornInId: {
            creatable: true,
            dtoName: "BornInId",
            otherKey: "id",
            otherName: "country",
            type: "reference-key"
        },
        countryId: {
            creatable: true,
            dtoName: "CountryId",
            otherName: "country",
            otherKey: "id",
            patchable: true,
            type: "reference-key"
        },
        country: {
            dtoName: "Country",
            key: "countryId",
            type: "reference"
        },
        metadata: undefined,
        reviews: {
            isArray: true,
            key: "reviewIds",
            type: "reference",
            virtual: true
        }
    })
    ;

class TypeMapper<T, M = {}> {
    // selectAll(): TypeBuilder<T, SelectedLocals<T> & D> {
    //     return this as any;
    // }

    selectAll(): TypeMapper<T, Local.All<T> & M> {
        return this as any;
    }

    select<K extends Local.Keys<T>, S = Exclude<T[K], undefined>>(k: K): TypeMapper<T, Record<K, S> & M> {
        return this as any;
    }

    selectIf<K extends Local.Keys<T>, S = T[K] | undefined>(k: K, flag: boolean): TypeMapper<T, Record<K, S> & M> {
        return this as any;
    }

    expand<K extends Navigable.Keys<T> & string, E = Navigable.OtherType<T[K]>, O = {}>(k: K, _: (eq: TypeMapper<E>) => TypeMapper<E, O>): TypeMapper<T, Record<K, Navigable<O, Box<Instance<O>, Property.ValueType<T[K]>>, K>> & M> {
        return this as any;
    }

    expandIf<K extends Navigable.Keys<T> & string, E = Navigable.OtherType<T[K]>, O = {}>(k: K, flag: boolean, _: (eq: TypeMapper<E>) => TypeMapper<E, O>): TypeMapper<T, Record<K, undefined | Navigable<O, Box<Instance<O>, Property.ValueType<T[K]>>, K>> & M> {
        return this as any;
    }

    get(): M {
        return null as any;
    }
}

let artistTypeMapper = new TypeMapper<ArtistType, {}>()
    .select(ArtistKeys.Name)
    .selectIf("diedAt", true)
    .select("countryId")
    // .expand("country", q => q.selectAll())
    .expandIf("country", false, q => q.selectAll().expand("createdBy", q => q.selectAll()))
    // .expandIf("country", q => q.selectAll().expand("createdBy", q => q.selectAll()))
    .expand("albums", q => q
        .selectAll()
        .expand("songs", q => q.selectAll())
        .expand("reviews", q => q
            .selectAll()
        )
    )
    .expandIf("reviews", true, q => q.selectAll())
    // .expand("albums", q => q.select(""))
    ;

let builtArtistType = artistTypeMapper.get();
builtArtistType.name.dtoName;
builtArtistType.albums.navigated.reviews.navigated;

// builtArtistType.
if (builtArtistType.country !== undefined) {
    builtArtistType.country.navigated.createdBy.navigated.id;
}

let builtArtistInstance: Instance<typeof builtArtistType> = {
    countryId: "at",
    name: "foo",
    country: {
        createdBy: {
            id: "da-magna",
            name: "magna",
            systemId: 64,
            userId: 1337
        },
        createdById: "da-magna",
        fooId: "foo",
        id: "at",
        name: "Austria herst"
    },
    albums: [
        {
            artistId: 1337,
            id: "ze-först",
            publishedAt: new Date(),
            reviewIds: ["review-1"],
            songs: [],
            updatedAt: new Date(),
            reviews: [
                {
                    id: "review-1",
                    text: "is a guads lied"
                }
            ],
            comments: []
        }
    ],
};

let builtArtistDtoInstance: Instance.Dto<typeof builtArtistType> = {
    Name: "foo",
    CountryId: "at",
    albums: [
        {
            ArtistId: 1,
            Id: "foo",
            PublishedAt: "1-2-3",
            UpdatedAt: "4-5-6",
            reviewIds: [],
            songs: [],
            reviews: [
                {
                    Id: "review-1",
                    Text: "is a guads lied"
                }
            ],
            comments: []
        }
    ],

};

interface TagType {
    id: Id<string, "id">;
    name: Local<string, "name", "Name">;
}

interface LyricsType {
    id: Id<number, "id", "Id">;
}

interface SongType {
    id: Id<number, "id", "Id">;
    albumId: Reference.Id<AlbumType, "albumId", "id">;
    album: Reference<AlbumType, "album", SongType["albumId"], "Album">;
    lyricsId: Reference.Id<LyricsType, "lyricsId", "id">;
}

let songs: Instance<SongType>[] = [
    {
        albumId: "larifari",
        id: 3,
        album: null as any,
        lyricsId: 3
    }
];

