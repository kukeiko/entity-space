import { Property } from "./property";
import { Instance } from "./instance";
import { Local, Complex, Id, Reference, Children, Navigable } from "./properties";
import { Box } from "./lang";

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
    id: Id<string, "id">;
    name: Local<string, "name", "Name">;
}

interface CountryType {
    id: Id<string, "id", "Id">;
    name: Local<string, "name", "Name">;
    createdById: Reference.Key<UserType, "createdById", "id", "CreatedById">;
    createdBy: Reference<UserType, "createdBy", CountryType["createdById"], "CreatedBy">;
}

interface ArtistType {
    id: Id<number, "id", "Id">;
    bornAt: Local<Date, "bornAt", "BornAt", number>;
    bornInId: Reference.Key<CountryType, "bornInId", "id", "BornInId">;
    diedAt: Local<Date | null, "diedAt", "DiedAt", number | null>;
    name: Local<string, "name", "Name">;
    albums: Children<AlbumType, "albums", "artistId", "Albums">;
    countryId: Reference.Key<CountryType, "countryId", "id", "CountryId">;
    country: Reference<CountryType, "country", ArtistType["countryId"], "Country">;
}

enum ArtistKeys {
    Name = "name"
}

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

    expandIf<K extends Navigable.Keys<T> & string, E = Navigable.OtherType<T[K]>, O = {}>(k: K, _: (eq: TypeMapper<E>) => TypeMapper<E, O>): TypeMapper<T, Record<K, undefined | Navigable<O, Box<Instance<O>, Property.ValueType<T[K]>>, K>> & M> {
        return this as any;
    }

    get(): M {
        return null as any;
    }
}


let artistTypeMapper = new TypeMapper<ArtistType, {}>()
    .select(ArtistKeys.Name)
    .selectIf("diedAt", true)
    // .expand("country", q => q.selectAll())
    .expandIf("country", q => q.selectAll().expand("createdBy", q => q.selectAll()))
    // .expandIf("country", q => q.selectAll().expand("createdBy", q => q.selectAll()))
    .expand("albums", q => q.selectAll().expand("songs", q => q.selectAll()))
    // .expand("albums", q => q.select(""))
    ;

let builtArtistType = artistTypeMapper.get();
builtArtistType.name.dtoName;

if (builtArtistType.country !== undefined) {
    builtArtistType.country.otherType.createdBy.otherType;
}

let builtArtistInstance: Instance<typeof builtArtistType> = {
    name: "foo",
    country: undefined,
    albums: [

    ]
};


let builtArtistDtoInstance: Instance.Dto<typeof builtArtistType> = {
    Name: "foo",
    albums: []
};

module ArtistType {

}

interface TagType {
    id: Id<string, "id">;
    name: Local<string, "name", "Name">;
}

interface Review {
    id: Id<string, "id">;
    text: Local<string, "text">;
}

interface AlbumType {
    id: Id<string, "id", "Id">;
    // [todo] test "undefined" via a query "expandIf()"
    artistId: Reference.Key<ArtistType, "artistId", "id", "ArtistId">;
    artist: Reference<ArtistType, "artist", AlbumType["artistId"], "Artist">;
    // artist: Navigable<ArtistType, "artist", "Artist">;
    publishedAt: Local<Date, "publishedAt", "PublishedAt", string>;
    // tags: External<TagType[], "tags", "id", "Tags">;
    updatedAt: Local<Date, "updatedAt", "UpdatedAt", string>;
    reviewIds: Reference.Key<Review[], "reviewIds", "id">;
    reviews: Reference.Virtual<Review[], "reviews", AlbumType["reviewIds"]>;
    songs: Children<SongType, "songs", "albumId", "Songs">;
}

// type Readonly = { readonly: true; };

// module Readonly {
//     export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Readonly | undefined ? P : never }[keyof T], undefined>;
// }

// type AlbumReadonlyKeys = Readonly.Keys<AlbumType>;

// type Foo = AlbumType["reviews"]["getValue"];

module AlbumType {
    type ReferenceKeyKeys = Reference.Key.Keys<AlbumType>;
    type DtoInstance = Instance.Dto<AlbumType>;
}

interface LyricsType {
    id: Id<number, "id", "Id">;
}

interface SongType {
    id: Id<number, "id", "Id">;
    albumId: Reference.Key<AlbumType, "albumId", "id">;
    album: Reference<AlbumType, "album", SongType["albumId"], "Album">;
    lyricsId: Reference.Key<LyricsType, "lyricsId", "id">;
}

module SongType {
    export type ReferenceKeyKeys = Reference.Key.Keys<SongType>;
}

let songs: Instance<SongType>[] = [
    {
        albumId: "larifari",
        id: 3,
        album: null as any,
        lyricsId: 3
    }
];

// type qwe = Property.RequiredKeys<AlbumType>;
// type qweasd = Property.RequiredWithKey<AlbumType, "id">;

type Quakiquak = Record<"foo" | "bar", number | string>;

/**
 *    ████████╗██╗   ██╗██████╗ ███████╗    ██████╗ ██╗   ██╗██╗██╗     ██████╗ ███████╗██████╗ 
 *    ╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝    ██╔══██╗██║   ██║██║██║     ██╔══██╗██╔════╝██╔══██╗
 *       ██║    ╚████╔╝ ██████╔╝█████╗      ██████╔╝██║   ██║██║██║     ██║  ██║█████╗  ██████╔╝
 *       ██║     ╚██╔╝  ██╔═══╝ ██╔══╝      ██╔══██╗██║   ██║██║██║     ██║  ██║██╔══╝  ██╔══██╗
 *       ██║      ██║   ██║     ███████╗    ██████╔╝╚██████╔╝██║███████╗██████╔╝███████╗██║  ██║
 *       ╚═╝      ╚═╝   ╚═╝     ╚══════╝    ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═╝
 */
class TypeBuilder<T, M = {}> {
    // selectAll(): TypeBuilder<T, SelectedLocals<T> & D> {
    //     return this as any;
    // }

    selectAll(): TypeBuilder<T, Local.Selected<T> & M> {
        return this as any;
    }

    select<K extends Local.Keys<T>, S = Exclude<T[K], undefined>>(k: K): TypeBuilder<T, Record<K, S> & M> {
        return this as any;
    }

    selectIf<K extends Local.Keys<T>, S = T[K] | undefined>(k: K, flag: boolean): TypeBuilder<T, Record<K, S> & M> {
        return this as any;
    }

    // expand<K extends NavigationKeys<T>, E = PropertyValueType<T[K]>, O = {}>(k: K, _: (eq: TypeBuilder<E, {}>) => TypeBuilder<E, O>): TypeBuilder<T, Record<K, Navigation<NullIfNull<O, PropertyValueType<T[K]>>>> & D> {
    //     return this as any;
    // }

    // expandIf<K extends NavigationKeys<T>, E = PropertyValueType<T[K]>, O = {}>(flag: boolean, k: K, _: (eq: TypeBuilder<E, {}>) => TypeBuilder<E, O>): TypeBuilder<T, Record<K, undefined | Navigation<NullIfNull<O, PropertyValueType<T[K]>>>> & D> {
    //     return this as any;
    // }

    get(): M {
        return null as any;
    }
}

let builder = (new TypeBuilder<AlbumType>())
    // let builder = (new TypeBuilder<AlbumType, AlbumType>())
    // let builder = (new TypeBuilder<AlbumType, Partial<AlbumType>>())
    // .selectAll()
    .select("id")
    .select("publishedAt")
    .select("artistId")
    // .select("updatedAt")
    .selectIf("updatedAt", true)
    ;


let built = builder.get();

let builtInstance: Instance<typeof built> = {
    id: "foo",
    publishedAt: new Date(),
    artistId: 1,
    // updatedAt: new Date()
};

let builtDtoInstance: Instance.Dto<typeof built> = {
    Id: "foo",
    PublishedAt: "1-2-3",
    ArtistId: 2,
    // UpdatedAt: "2-3-4"
};

/**
 *    ██████╗  ██████╗ ███╗   ███╗ █████╗ ██╗███╗   ██╗
 *    ██╔══██╗██╔═══██╗████╗ ████║██╔══██╗██║████╗  ██║
 *    ██║  ██║██║   ██║██╔████╔██║███████║██║██╔██╗ ██║
 *    ██║  ██║██║   ██║██║╚██╔╝██║██╔══██║██║██║╚██╗██║
 *    ██████╔╝╚██████╔╝██║ ╚═╝ ██║██║  ██║██║██║ ╚████║
 *    ╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝
 */

// function define<T>(def: {
//     locals: { [K in LocalKeys<T>]: T[K] extends Local<infer RT, infer RD> ? Local.Options<RT, RD> : never; },
//     navigations: { [K in NavigationKeys<T>]: T[K] extends Navigation<infer R> ? Navigation.Options<R> : never; }
// }): T {
//     return null as any;
// }

class DomainBuilder<M> {
    types: M = {} as any;

    add<T, K extends string>(name: K, type: T): DomainBuilder<Record<K, T> & M> {
        return this as any;
    }

    isRegistered(typeKey: any): typeKey is keyof M {
        return typeKey in this.types;
    }
}

/**
 *    ████████╗███╗   ███╗██████╗
 *    ╚══██╔══╝████╗ ████║██╔══██╗
 *       ██║   ██╔████╔██║██████╔╝
 *       ██║   ██║╚██╔╝██║██╔═══╝
 *       ██║   ██║ ╚═╝ ██║██║
 *       ╚═╝   ╚═╝     ╚═╝╚═╝
 *
 */

// let albums: Instance<AlbumType>[] = [
//     {
//         id: "fancy-album",
//         artist: {
//             id: 1,
//             name: "Infected Mushroom",
//             bornAt: new Date(),
//             diedAt: null,
//             albums: [],
//             bornInId: "israel",
//             country: {
//                 id: "israel"
//             },
//             countryId: "israel"
//         },
//         publishedAt: new Date(),
//         songs: [
//             {
//                 albumId: "fancy-album",
//                 id: 1,
//                 lyricsId: 123
//             }
//         ],
//         tags: [
//             {
//                 id: "hogla",
//                 name: "fancy"
//             }
//         ]
//     },
//     {
//         id: "groovy-album",
//         artist: {
//             id: 1,
//             name: "Infected Mushroom",
//             bornAt: new Date(),
//             diedAt: null,
//             albums: []
//         },
//         publishedAt: new Date(),
//         songs: [],
//         tags: [
//             {
//                 id: "bogla",
//                 name: "groovy"
//             }
//         ]
//     }
// ];

// albums.forEach(album => {
//     if (album.artist !== undefined) {
//         console.log(album.artist.name);
//     }

//     console.log(album.publishedAt.getTime());
// });

// let albumDtos: Instance.Dto<AlbumType>[] = [
//     {
//         Id: "foo-album",
//         Artist: {
//             Id: 1,
//             Name: "foo",
//             BornAt: 1337,
//             DiedAt: null,
//             Albums: []
//         },
//         PublishedAt: "1-2-3",
//         Tags: [
//             {
//                 Name: "foozy"
//             }
//         ]
//     },
//     {
//         Id: "bar",
//         Artist: {
//             Id: 2,
//             Name: "bar",
//             BornAt: 64,
//             DiedAt: 128,
//             Albums: []
//         },
//         PublishedAt: "3-2-1",
//         Tags: [
//             {
//                 Name: "barzy"
//             }
//         ]
//     }
// ];

// albumDtos.forEach(albumDto => {

// });

// type AlbumArtistProperty = DtoPropertyWithName<AlbumType, "Artist">;
// type Larifari = undefined extends AlbumType["publishedAt"] ? true : false;

// type QuakFoo = DtoPropertyWithName<AlbumType, "PublishedAt">;

// type AlbumPublishedAtDtoValueType = DtoPropertyValueType<AlbumType["publishedAt"]>;


// type ArticleInstance = Instance<ArticleType>;

// type AuthorInstance = Instance<AuthorType>;


// class TypeDescriptor<B, D = {}> {

//     // selectAll(): TypeDescriptor<B, SelectedLocals<B> & D> {

//     //     return this as any;

//     // }


//     // select<K extends LocalKeys<B>, S = SelectedValueType<B, K>>(k: K): TypeDescriptor<B, Record<K, S> & D> {

//     //     return this as any;

//     // }


//     expand<K extends NavigationKeys<B>, E = ExpandedBlueprint<B, K>, O = {}>(k: K, _: (eq: TypeDescriptor<E, {}>) => TypeDescriptor<E, O>): TypeDescriptor<B, WithExpandedDescribed<B, K, O, D>> {

//         return this as any;

//     }

// }

// type Wakfoo = "a" | "b" extends "a" ? true : false;
