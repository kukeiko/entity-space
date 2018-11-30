import { Entity } from "./type-playground";

export class Artist extends Entity<Artist> {
    albums?: Album[];
    country?: Country | null;
    name?: string;
    born?: Date;
}

export class Album extends Entity<Album> {
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
    foo?: void;
}

export class Song extends Entity<Song> {
    albumId?: number;
    album?: Album;
    artistId?: number;
    artist?: Artist;
    tags?: Tag[];
    alsoOnAlbum?: Album;
}

export class Country extends Entity<Country> {
    name?: string;
    moo!: string;
    quak?: Artist;
}

export class Tag extends Entity<Tag> {
    // album?: Album;
    value?: string;
}

// export type UnboxChildren<T> = T extends Children<infer C> ? C : T;
// export type BoxChildren<T, A = T> = A extends Children<infer C> ? Children<T> : T;

export type Unbox<T> = T extends any[] ? T[number] : T;
export type Box<T, A = T> = A extends any[] ? T[] : T;
export type ExcludeVoid<T> = Exclude<T, void>;
export type ExcludeNullsy<T> = Exclude<T, void | null>;
export type Expandables<T> = ({ [P in keyof T]-?: T[P] extends Entity[] | undefined ? P : T[P] extends Entity | undefined | null ? P : never; })[keyof T];

export class ExpansionQuery<T> {
    expand<K extends Expandables<T>, E = ExcludeNullsy<T[K]>, X = Unbox<E>, R = X>(k: K, _?: (eq: ExpansionQuery<X>) => ExpansionQuery<R>): ExpansionQuery<Record<K, Box<R, E>> & T> {
        return this as any;
    }
}

export class RootQuery<T> {
    // expand<K extends Expandables<T>, E = ExcludeVoid<T[K]>, X = Unbox<E>, R = X>(k: K, _?: (eq: ExpansionQuery<X>) => ExpansionQuery<R>): RootQuery<Record<K, Box<R, E>> & T>;
    expand<K extends Expandables<T>, E = ExcludeNullsy<T[K]>, X = Unbox<E>, R = X>(k: K, _?: (eq: ExpansionQuery<X>) => ExpansionQuery<R>): RootQuery<Record<K, Box<R, E>> & T>;
    expand(...args: any[]): any {
        return this as any;
    }

    execute(): T[] {
        return null as any;
    }
}

let albums = (new RootQuery<Album>())
    // .expand("foo")
    .expand("artist", q => q.expand("albums"))
    .expand("country", q => q.expand("quak"))
    // .expand("tags", "album")
    .expand("songs", q => q.expand("tags"))
    // .expand("")
    // .expand("")
    .execute();

function doStuff(albums: Album[]): void {
    // albums.forEach(a => a.)
}

doStuff(albums);

albums.forEach(album => {
    // [todo] album.country should be nullable
    let foo = album.country;

    album.songs.forEach(s => {

        // s.
    });
});
