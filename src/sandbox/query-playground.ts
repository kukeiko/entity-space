export interface Children<T, A = T[]> {
    forEach(x: (v: T) => any): void;
    all(): A;
}

export abstract class Entity {
    $stuff!: object;
}

export class Artist extends Entity {
    albums?: Album[];
    country?: Country | null;
    name?: string;
}

export class Album extends Entity {
    // [note] necessary because if every class has voidable properties, type inference becomes impossibru
    type: "Album" = "Album";
    country?: Country | null;
    artistId?: number;
    artist?: Artist;
    songs?: Song[];
    // songs?: Children<Song>;
    tags?: Tag[];
    name?: string;
    released?: Date | null;
}

export class Song extends Entity {
    albumId?: number;
    album?: Album;
    artistId?: number;
    artist?: Artist;
    tags?: Tag[];
}

export class Country extends Entity {
    name?: string;
    moo!: string;
    quak?: Artist;
}

export class Tag extends Entity {
    // album?: Album;
    value?: string;
}

export type UnboxChildren<T> = T extends Children<infer C> ? C : T;
export type BoxChildren<T, A = T> = A extends Children<infer C> ? Children<T> : T;

export type Unbox<T> = T extends any[] ? T[number] : T;
export type Box<T, A = T> = A extends any[] ? T[] : T;
export type ExcludeNullsy<T> = Exclude<T, void | null>;
export type ExcludeNonExpandable<T> = {
    [K in keyof T]-?: Exclude<T[K], string | number>;
};

export type ReferenceKeys<T> = ({ [P in keyof T]-?: T[P] extends Entity | void | null ? P : never })[keyof T];
export type CollectionKeys<T> = ({ [P in keyof T]-?: T[P] extends Entity[] | void ? P : never })[keyof T];
export type ChildrenKeys<T> = ({ [P in keyof T]-?: T[P] extends Entity[] | void ? P : never })[keyof T];
// export type ChildrenKeys<T> = ({ [P in keyof T]-?: T[P] extends Children<Entity> | void ? P : never })[keyof T];

export type ParentKeys<T, P> = ({ [F in keyof T]-?: T[F] extends P ? F : never })[keyof T];

// type SongParent = ParentKeys<Song, Album | void>;

export class ExpansionQuery<T> {
    expand<K extends keyof T, E = ExcludeNullsy<T[K]>, X = Unbox<E>, R = Unbox<E>>(k: K, _?: (eq: ExpansionQuery<X>) => ExpansionQuery<R>): ExpansionQuery<Record<K, Box<R | null, E>> & T> {
        return this as any;
    }
}

export class RootQuery<T, OT, UT = Unbox<T>> {
    // expandChildren<K extends ChildrenKeys<UT>, PK extends ParentKeys<Unbox<ExcludeNullsy<UT[K]>>, UT | void>, E = ExcludeNullsy<UT[K]>, X = Unbox<E>, R = Unbox<E>>(k: K, pk: PK, _?: (eq: ExpansionQuery<X>) => ExpansionQuery<R>): RootQuery<Box<UT & Record<K, Box<R | null, E>>, T>> {
    //     return this as any;
    // }

    foo<K extends ChildrenKeys<UT>, PK extends ParentKeys<Unbox<ExcludeNullsy<UT[K]>>, UT | void>>(k: K, pk: PK): void {

    }

    // [todo] shouldn't "E" also be unboxed?
    expand<
        K extends ChildrenKeys<UT>,
        PK extends ParentKeys<Unbox<ExcludeNullsy<UT[K]>>, OT | void>,
        E = ExcludeNullsy<UT[K]>,
        X = Unbox<E> & Record<PK, Record<K, Box<R | null, E>> & UT>,
        R = X
        >(k: K, pk: PK, _?: (eq: ExpansionQuery<X>) => ExpansionQuery<R>): RootQuery<Box<Record<K, Box<R, E>> & UT, T>, OT>;
    // expand<
    //     K extends ChildrenKeys<UT>,
    //     PK extends ParentKeys<UnboxChildren<ExcludeNullsy<UT[K]>>, OT | void>,
    //     E = ExcludeNullsy<UT[K]>,
    //     X = UnboxChildren<E> & Record<PK, Record<K, BoxChildren<R | null, E>> & UT>,
    //     R = X
    //     >(k: K, pk: PK, _?: (eq: ExpansionQuery<X>) => ExpansionQuery<R>): RootQuery<Box<Record<K, BoxChildren<R, E>> & UT, T>, OT>;
    expand<K extends ReferenceKeys<UT>, E = ExcludeNullsy<UT[K]>, X = Unbox<E>, R = X>(k: K, _?: (eq: ExpansionQuery<X>) => ExpansionQuery<R>): RootQuery<Box<Record<K, Box<R, E>> & UT, T>, OT>;
    expand(...args: any[]): any {
        return this as any;
    }

    execute(): T {
        return null as any;
    }

    // [note] original
    // expand<K extends keyof UT, E = ExcludeNullsy<UT[K]>, X = Unbox<E>, R = Unbox<E>>(k: K, _?: (eq: ExpansionQuery<X>) => ExpansionQuery<R>): RootQuery<Box<UT & Record<K, Box<R | null, E>>, T>>;
}

let albums = (new RootQuery<Album[], Album>())
    .expand("artist", q => q.expand("country"))
    .expand("country")
    .expand("songs", "album", q => q.expand("tags", q => q.expand("value")))
    // .expand("")
    .execute();

// export class Collection<A extends any[], T = A[number]> {
//     constructor(v: A) {

//     }

//     forEach(x: (v: T) => any) {

//     }
// }

function doStuff(albums: Album[]): void {
    // albums.forEach(a => a.)
}

doStuff(albums);

albums.forEach(album => {
    let foo = album.country;


    // album.c
    // let country = album.artist.country;
    // let foo = country.name;

    // album.songs.forEach(s => s.)
    // let songs: Children<Song> = new Collection(album.songs);
    album.songs.forEach(s => {
        // s.album = void;
        // s.album.songs.forEach(x => x.)
        // s.album.
        // s.album.artist.country
        // s.
        // let foo = s.tags[0].value;

        // let tags = new Collection(s.tags);
        // tags.forEach(t => t.)
    });
    // let songs = album.songs as Collection<typeof album.song

    // col.foreach(x => x.)
});

    // albums[0].songs[0].album.
    // albums[0].
    // .expand("artist", q => q.expand("country").expand("country", q => q.expand("name")))
    // .expand("songs", "album", q => q.expand(""));    // .execute();

// albums.forEach(album => {
//     album.songs.forEach(song => {

//     });
// });


// type a = ChildrenKeys<Album>;
// type Foo = ExcludeNonExpandable<Artist>;
// type FooKeys = keyof Foo;

// type JustMethodKeys<T> = ({ [P in keyof T]-?: T[P] extends number | string | Date | void ? never : P })[keyof T];
// type Expandable<T> = ({[P in keyof T]: T[P] extends number ? never : P })[keyof T];

// type JustMethods<T> = Pick<T, JustMethodKeys<T>>;
// type FooKeys = JustMethodKeys<Album>;
// type Foo = JustMethods<Album>;

// export type Metadata<T, K = keyof T> = {
//     references: K[];
//     collections: K[];
// };

// type Moo = Metadata<Album>["references"];

// let albumMetadata = new Metadata<Album>();
// albumMetadata.references.push("artist");






// export type RootQueriedType = {
//     foo?: FooQueriedType;
//     khaz?: KhazQueriedType[];
// };

// export type KhazQueriedType = { mo?: MoQueriedType; };
// export type MoQueriedType = { dan?: DanQueriedType | null; };
// export type DanQueriedType = { boozle: string; };

// export type FooQueriedType = { bar?: BarQueriedType | null; };
// export type BarQueriedType = { baz?: BazQueriedType | null; };
// export type BazQueriedType = { bam: string; };

// let query = new RootQuery<RootQueriedType>();

// let result = query
//     .expand("foo", eq => eq.expand("bar", eq => eq.expand("baz")))
//     .expand("khaz", eq => eq.expand("mo", eq => eq.expand("dan")))
//     .execute();

// let bar = result.foo.bar;

// if (bar !== null && bar.baz !== null) {
//     bar.baz.bam;
// }

// result.khaz[0].mo.dan;

// let stuff = (new RootQuery<RootQueriedType[]>()).expand("foo", x => x.expand("bar")).execute();
