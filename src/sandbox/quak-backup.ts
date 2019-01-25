export type Dummy = null;

type Unbox<T> = T extends any[] ? T[number] : T;
type Box<T, A = T> = A extends any[] ? T[] : T;

/**
 *    ███╗   ███╗███████╗████████╗ █████╗ ██████╗  █████╗ ████████╗ █████╗ 
 *    ████╗ ████║██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗
 *    ██╔████╔██║█████╗     ██║   ███████║██║  ██║███████║   ██║   ███████║
 *    ██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██║  ██║██╔══██║   ██║   ██╔══██║
 *    ██║ ╚═╝ ██║███████╗   ██║   ██║  ██║██████╔╝██║  ██║   ██║   ██║  ██║
 *    ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝
 */
interface Property<T, N extends string> {
    name: N;
    getValue<U extends Record<N, T>>(instance: U): T;
    setValue<U extends Record<N, T>>(instance: U, value: T): void;
}

module Property {
    export type Keys<T> = Exclude<{ [P in keyof T]: T[P] extends Property<any, any> | undefined ? P : never }[keyof T], undefined>;
}

interface DtoProperty<T, N extends string, A extends string = N, D = T> extends Property<T, N> {
    dtoName: A;
    fromDto: (dtoValue: D) => T;
    toDto: (value: T) => D;
}

type OptionalPropertyDtoKeys<T> = Exclude<{ [P in keyof T]: undefined extends T[P] ? (T[P] extends DtoProperty<any, any, infer A> | undefined ? A : never) : never }[keyof T], undefined>;
type RequiredPropertyDtoKeys<T> = Exclude<{ [P in keyof T]: T[P] extends DtoProperty<any, any, infer A> ? A : never }[keyof T], undefined>;
type PropertyDtoKeys<T> = OptionalPropertyDtoKeys<T> | RequiredPropertyDtoKeys<T>;

type DtoPropertyValueType<T> = T extends DtoProperty<any, any, any, infer D> ? D : never;

type OptionalDtoPropertyWithName<T, A extends OptionalPropertyDtoKeys<T>> = Exclude<{ [P in keyof T]: T[P] extends DtoProperty<any, any, A> | undefined ? T[P] : never }[keyof T], undefined>;
type RequiredDtoPropertyWithName<T, A extends RequiredPropertyDtoKeys<T>> = { [P in keyof T]: T[P] extends DtoProperty<any, any, A> ? T[P] : never }[keyof T];
type DtoPropertyWithName<T, A extends PropertyDtoKeys<T>> =
    A extends OptionalPropertyDtoKeys<T>
    ? OptionalDtoPropertyWithName<T, A>
    : A extends RequiredPropertyDtoKeys<T> ? RequiredDtoPropertyWithName<T, A>
    : never;

// type OptionalDtoInstance<T> = { [P in OptionalPropertyDtoKeys<T>]?: DtoPropertyValueType<OptionalDtoPropertyWithName<T, P>>; };
type OptionalDtoInstance<T> = { [P in OptionalPropertyDtoKeys<T>]?: DtoPropertyValueType<OptionalDtoPropertyWithName<T, P>>; };
type RequiredDtoInstance<T> = { [P in RequiredPropertyDtoKeys<T>]: DtoPropertyValueType<RequiredDtoPropertyWithName<T, P>>; };
type DtoInstance<T> = RequiredDtoInstance<T> & OptionalDtoInstance<T>;

interface Local<T, N extends string, A extends string = N, D = T> extends DtoProperty<T, N, A, D> {
    lari: "fari";
}

interface Navigation<T, N extends string, A extends string = N> extends DtoProperty<Box<Instance<Unbox<T>>, T>, N, A, Box<DtoInstance<Unbox<T>>, T>> {
    otherType: string;
}

// interface Externa

interface Reference<T, N extends string, A extends string = N> extends Navigation<T, N, A> {

}

type Instance<T> = { [P in keyof T]
    : T[P] extends Property<infer R, any> | undefined ? R
    : never
};

/***
 *    ██╗   ██╗███████╗███████╗██████╗     ████████╗██╗   ██╗██████╗ ███████╗███████╗
 *    ██║   ██║██╔════╝██╔════╝██╔══██╗    ╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔════╝
 *    ██║   ██║███████╗█████╗  ██████╔╝       ██║    ╚████╔╝ ██████╔╝█████╗  ███████╗
 *    ██║   ██║╚════██║██╔══╝  ██╔══██╗       ██║     ╚██╔╝  ██╔═══╝ ██╔══╝  ╚════██║
 *    ╚██████╔╝███████║███████╗██║  ██║       ██║      ██║   ██║     ███████╗███████║
 *     ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝       ╚═╝      ╚═╝   ╚═╝     ╚══════╝╚══════╝
 */
interface ArtistType {
    bornAt: Local<Date, "bornAt", "BornAt", number>;
    diedAt: Local<Date | null, "diedAt", "DiedAt", number | null>;
    name: Local<string, "name", "Name">;
}

interface TagType {
    name: Local<string, "name", "Name">;
}

interface AlbumType {
    // [todo] test "undefined" via a query "expandIf()"
    // artist?: Navigation<ArtistType, "artist", "Artist">;
    artist: Navigation<ArtistType, "artist", "Artist">;
    publishedAt: Local<Date, "publishedAt", "PublishedAt", string>;
    tags: Navigation<TagType[], "tags", "Tags">;
}

/***
 *    ████████╗███╗   ███╗██████╗
 *    ╚══██╔══╝████╗ ████║██╔══██╗
 *       ██║   ██╔████╔██║██████╔╝
 *       ██║   ██║╚██╔╝██║██╔═══╝
 *       ██║   ██║ ╚═╝ ██║██║
 *       ╚═╝   ╚═╝     ╚═╝╚═╝
 *
 */

type AlbumTypePropertyKeys = Property.Keys<AlbumType>;
type AlbumTypeOptionalPropertyDtoKeys = OptionalPropertyDtoKeys<AlbumType>;
type AlbumTypeRequiredPropertyDtoKeys = RequiredPropertyDtoKeys<AlbumType>;
type AlbumTypePropertyDtoKeys = PropertyDtoKeys<AlbumType>;
type AlbumTypeOptionalDtoInstance = OptionalDtoInstance<AlbumType>;
type AlbumTypeRequiredDtoInstance = RequiredDtoInstance<AlbumType>;

let albums: Instance<AlbumType>[] = [
    {
        artist: {
            name: "Infected Mushroom",
            bornAt: new Date(),
            diedAt: null
        },
        publishedAt: new Date(),
        tags: [
            {
                name: "fancy"
            }
        ]
    },
    {
        artist: {
            name: "Infected Mushroom",
            bornAt: new Date(),
            diedAt: null
        },
        publishedAt: new Date(),
        tags: [
            {
                name: "groovy"
            }
        ]
    }
];

let albumType: AlbumType = {} as any;
// albumType.tags.
// albumType.tags.getValue({} as any)[0].name

albums.forEach(album => {
    if (album.artist !== undefined) {
        console.log(album.artist.name);
    }

    console.log(album.publishedAt.getTime());
});

let albumDtos: DtoInstance<AlbumType>[] = [
    {
        Artist: {
            Name: "foo",
            BornAt: 1337,
            DiedAt: null
        },
        PublishedAt: "1-2-3",
        Tags: [
            {
                Name: "foozy"
            }
        ]
    },
    {
        Artist: {
            Name: "bar",
            BornAt: 64,
            DiedAt: 128
        },
        PublishedAt: "3-2-1",
        Tags: [
            {
                Name: "barzy"
            }
        ]
    }
];


albumDtos.forEach(albumDto => {

});

type AlbumArtistProperty = DtoPropertyWithName<AlbumType, "Artist">;
type Larifari = undefined extends AlbumType["publishedAt"] ? true : false;


type QuakFoo = DtoPropertyWithName<AlbumType, "PublishedAt">;

type AlbumPublishedAtDtoValueType = DtoPropertyValueType<AlbumType["publishedAt"]>;



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

