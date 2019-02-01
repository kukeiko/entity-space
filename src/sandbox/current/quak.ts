import { Property } from "./property";
import { Instance } from "./instance";
import { Local, Complex, Id, Reference, Child, Navigable, Simple, Struct, Unique } from "./properties";
import { Box } from "./lang";
import { DomainBuilder } from "./domain-builder";
import { Type } from "./type";
import { Modifier } from "./modifier";

// [todo] think about supporting the different types of restrictions (e.g. EventNodeRestriction, which inherits from Restriction afaik)
interface BonusRestrictionType {
    key: Local<string, "key", "Key">;
    value: Local<string, "value", "Value">;
    // [todo] think about virtuals nao, wrote this comment to never forget
}

interface BonusRestrictionsPerCutPointType {
    // "1": Complex<BonusRestrictionType[], "1">;
    // "2": Complex<BonusRestrictionType[], "2">;
    // "3": Complex<BonusRestrictionType[], "3">;
    "1": Struct<BonusRestrictionType[], "1">;
    "2": Struct<BonusRestrictionType[], "2">;
    "3": Struct<BonusRestrictionType[], "3">;
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
    export type BonusInstance = Instance<BonusType[]>;
    export type BonusDtoInstance = Instance.Dto<BonusType>;
}

type Jarg = BonusType.BonusInstance;


interface UserType extends Type<"user"> {
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

const Uuid = function () {
    return "foo";
};


interface Metadata extends Type<"metadata"> {
    createdAt: Local<Date, "createdAt", "CreatedAt", number>;
    updatedAt: Local<Date | null, "updatedAt", "UpdatedAt", number | null>;
    // creatorId: Reference.Id<
}



// [stopped at] thinking on what type the Collection.Key should be
interface AlbumType extends Type<"album"> {
    id: Id<string, "id", "Id">;
    // [todo] test "undefined" via a query "expandIf()"
    artistId: Reference.Id<ArtistType, "artistId", "id", "ArtistId">;
    artist: Reference<ArtistType, "artist", AlbumType["artistId"], "Artist">;
    // artist: Navigable<ArtistType, "artist", "Artist">;
    price: Simple<typeof Number, "price", "Price", string>;
    priceHistory: Simple<typeof Number[], "priceHistory", "PriceHistory", string>;
    publishedAt: Local<Date, "publishedAt", "PublishedAt", string>;
    // tags: External<TagType[], "tags", "id", "Tags">;
    updatedAt: Local<Date, "updatedAt", "UpdatedAt", string>;
    reviewIds: Reference.Id<ReviewType[], "reviewIds", "id">;
    reviews: Reference.Virtual<ReviewType[], "reviews", AlbumType["reviewIds"]>;
    // reviews: Collection<Review, "reviews", AlbumType["reviewIds"]>;
    songs: Child<SongType[], "songs", "album", "Songs">;
    comments: Local<string[], "comments">;
}

type AlbumPriceValueType = ReturnType<AlbumType["price"]["read"]>;
type AlbumPriceValueDtoType = ReturnType<AlbumType["price"]["readDto"]>;
type AlbumPriceHistoryValueType = ReturnType<AlbumType["priceHistory"]["read"]>;
type AlbumPriceHistoryDtoValueType = ReturnType<AlbumType["priceHistory"]["readDto"]>;
type AlbumDtoInstance = Instance.Dto<AlbumType>;
type Foo3 = Property.WithKey<AlbumType, "priceHistory">;


interface ArtistType extends Type<"artist"> {
    id: Id<number, "id", "Id", string>;
    // bornAt: Local.Creatable<Date, "bornAt", "BornAt", number>;
    bornAt: Simple<typeof Date, "bornAt", "BornAt", number>;
    bornInId: Reference.Id.Creatable<CountryType, "bornInId", "id", "BornInId">;
    diedAt: Simple<typeof Date | null, "diedAt", "DiedAt">;
    // name: Local<string, "name", "Name">;
    name: Simple<typeof String | null, "name", "Name">;
    nameHistory: Simple<typeof String[] | null, "nameHistory", "NameHistory">;
    // albums: Child<AlbumType[], "albums", "artist", "Albums">;
    albums: Child<AlbumType, "albums", "artist", "Albums">;
    countryId: Reference.Id.Patchable<CountryType | null, "countryId", "id", "CountryId">;
    country: Reference<CountryType | null, "country", ArtistType["countryId"], "Country">;
    reviewIds: Reference.Id<ReviewType[], "reviewIds", "id">;
    reviews: Reference.Virtual<ReviewType[], "reviews", ArtistType["reviewIds"]>;
    metadata: Complex<Metadata, "metadata", "Metadata">;
}

// type Foo = Box<Property.ValueType<Property.WithKey<U, P>>;
// type Foo = Property.ValueType<Property.WithKey<CountryType, "id">>;
// type Foo = ArtistType["countryId"] extends Reference.Key<infer A, infer B, infer C, infer D, infer E, infer F> ? true : false;
// type Foo = ArtistType["country"] extends Reference<any, any, any, any> ? true : false;
type Foo = ArtistType["countryId"] extends (Reference.Id<infer R, infer K, infer P, infer A, infer V, infer D>) ? true : false;
type Khaz = ArtistType["countryId"] extends Reference.Id.Creatable<any, any, any, any, any, any> ? true : false;
type Mo = ArtistType["albums"] extends Navigable<any, infer _1, infer _2> ? true : false;

type ArtistCreatableKeys = Local.Creatable.Keys<ArtistType>;
type ArtistCreatableReferenceKeys = Reference.Id.Creatable.Keys<ArtistType>;
type ArtistPatchableReferenceKeys = Reference.Id.Patchable.Keys<ArtistType>;
type ArtistLocalKeys = Local.Keys<ArtistType>;
type ArtistArrayKeys = Property.Array.Keys<ArtistType>;
type ArtistUniqueKeys = Unique.Keys<ArtistType>;
type ArtistNavigationKeys = Navigable.Keys<ArtistType>;
type ArtistNameValue = ReturnType<ArtistType["name"]["read"]>;
type ArtistNameHistoryValue = ReturnType<ArtistType["nameHistory"]["read"]>;
type ArtistNameDtoValue = ReturnType<ArtistType["name"]["readDto"]>;
type ArtistNameValueConstructor = ArtistType["name"]["valueConstructor"];

type ArtistDiedAt = ArtistType["diedAt"];
type ArtistTypeDto = Instance.Dto<ArtistType>;
// type blarb = ArtistType["name"][""];
type DtoValue = Property.Dto.ValueType<ArtistType["bornAt"]>;
type ArtistComplexKeys = Complex.Keys<ArtistType>;

let reviewsShouldExtendArray: (ArtistType["reviews"] extends Property.Array<infer _V, infer _K> ? true : false) = true;
let countryShouldNotExtendArray: (ArtistType["country"] extends Property.Array<infer _V, infer _K> ? true : false) = false;

// let albumDtoInstance : AlbumDtoInstance = {
//     Price
// }

export module AlbumType {
    export const keys = Type.createKeys<AlbumType>({
        artist: "artist",
        artistId: "artistId",
        id: "id",
        publishedAt: "publishedAt",
        price: "price",
        priceHistory: "priceHistory",
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
type queqwe = Reference.Id<any, any, any, any, any>;

// [stopped at] thinking on how the domainbuilder identifies each property,
// as it will have to autofill quite a lot on its own (like e.g. reference)
let domainBuilder = new DomainBuilder()
    .add<ArtistType, Type.NameOf<ArtistType>>({
        $: {
            name: "artist"
        },
        // id: {
        //     dtoKey: "Id",
        //     fromDto: x => +x,
        //     toDto: x => x.toString(),
        //     type: "id"
        // },
        bornInId: {
            creatable: true,
            dtoKey: "BornInId",
            otherKey: "id",
            otherName: "country",
            type: "reference-key"
        },
        countryId: {
            // array: true,
            creatable: true,
            dtoKey: "CountryId",
            otherKey: "id",
            otherName: "country",
            patchable: true,
            type: "reference-key"
        },
        // countryId: {
        //     otherName: "country",
        //     // creatable: true,
        //     // dtoKey: "CountryId",
        //     // // otherName: "country",
        //     // otherKey: "id",
        //     // patchable: true,
        //     // type: "reference-key"
        // },
        // country: {
        //     dtoKey: "Country",
        //     localKey: "countryId",
        //     type: "reference"
        // },
        // diedAt:
        //     metadata: undefined,
        // reviews: {
        //     array: true,
        //     // array: true,
        //     virtual: true,
        //     // array: true,
        //     localKey: "reviewIds",
        //     type: "reference",

        //     // virtual
        //     // virtual: true
        // }
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
    .selectIf("bornAt", true)
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
        .expand("artist", q => q.select("bornAt"))
    )
    .expandIf("reviews", true, q => q.selectAll())
    // .expand("albums", q => q.select(""))
    ;

let builtArtistType = artistTypeMapper.get();
builtArtistType.name.dtoKey;
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
            artist: {
                bornAt: "123-123"
            },
            artistId: 1337,
            id: "ze-först",
            publishedAt: new Date(),
            price: 1,
            priceHistory: [1, 2, 3],
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
            artist: {
                BornAt: 123
            },
            Id: "foo",
            PublishedAt: "1-2-3",
            UpdatedAt: "4-5-6",
            Price: "1337,64",
            PriceHistory: ["10,2"],
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
    reviews: [
        {
            Id: "123",
            Text: "asd"
        }
    ]

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

