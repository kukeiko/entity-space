export interface Property<K extends string = any, V = any> {
    key: K;
    value: V;
}

export interface Selectable<S> {
    selectable: S;
}

export module Selectable {
    export type Keys<T> = ({ [K in keyof T]: T[K] extends Selectable<any> ? K : never })[keyof T];
}

export interface Selected<S = any> {
    selected: S;
}

export interface Expandable {
    expandable: true;
}

export module Expandable {
    export type Keys<T> = ({ [K in keyof T]: T[K] extends Expandable ? K : never })[keyof T];
}

export interface Expanded<E> {
    expanded: E;
}

export interface Iterable {
    iterable: true;
}

export interface Nullable {
    nullable: true;
}

export module Nullable {
    export type Flag = "nullable";

    export module Flag {
        export type IsSet<F extends string[]> = Nullable.Flag extends F[number] ? true : false;

        export function isSet<F extends string[]>(f?: F): IsSet<F> {
            return f?.includes("nullable") || false as any;
        }
    }
}

export interface Creatable {
    creatable: true;
}

export module Creatable {
    export type Flag = "creatable";

    export module Flag {
        export type IsSet<F extends string[]> = undefined extends F ? false : Creatable.Flag extends F[number] ? true : false;

        export function isSet<F extends string[]>(f?: F): IsSet<F> {
            return f?.includes("creatable") || false as any;
        }
    }
}

export interface Patchable {
    patchable: true;
}

export module Patchable {
    export type Flag = "patchable";

    export module Flag {
        export type IsSet<F extends string[]> = undefined extends F ? false : Patchable.Flag extends F[number] ? true : false;

        export function isSet<F extends string[]>(f?: F): IsSet<F> {
            return f?.includes("patchable") || false as any;
        }
    }
}

export interface Unique {
    unique: true;
}

export module Unique {
    export type Flag = "unique";

    export module Flag {
        export type IsSet<F extends string[]> = Unique.Flag extends F[number] ? true : false;

        export function isSet<F extends string[]>(f?: F): IsSet<F> {
            return f?.includes("unique") || false as any;
        }
    }
}

export type Primitive = typeof Boolean | typeof Number | typeof String;

type OptionalPropertyKeys<T> = ({ [K in keyof T]: undefined extends T[K] ? (T[K] extends Property | undefined ? K : never) : never })[keyof T];
type OptionalProperties<T> = { [K in OptionalPropertyKeys<T>]?: T[K]; };

type RequiredPropertyKeys<T> = ({ [K in keyof T]: T[K] extends Property ? K : never })[keyof T];
type RequiredProperties<T> = { [K in RequiredPropertyKeys<T>]: T[K]; };

type Properties<T> = OptionalProperties<T> & RequiredProperties<T>;

type SelectedType<T>
    = T extends Primitive ? ReturnType<T>
    : {
        [K in keyof Properties<T>]?: T[K] extends Property ? T[K] & Selected<SelectedType<T[K]["value"]>> : never
    };

type BoxPropertyValue<T, V>
    = T extends Nullable ? T extends Iterable ? V[] | null : V | null
    : T extends Iterable ? V[] : V;

type InstancedPropertyValue<T> = T extends Selected ? BoxPropertyValue<T, Instance<T["selected"]>> : never;

type Instance<T> = T extends Primitive ? ReturnType<T> : { [K in keyof Properties<T>]: InstancedPropertyValue<T[K]>; };

function createPrimitive<K extends string, V extends Primitive, F extends (Creatable.Flag | Patchable.Flag | Unique.Flag)[] = never[]>(key: K, value: V, flags?: F): {
    creatable: Creatable.Flag.IsSet<F>;
    patchable: Patchable.Flag.IsSet<F>;
    unique: Unique.Flag.IsSet<F>;
} & Property<K, V> {
    return {
        creatable: Creatable.Flag.isSet(flags),
        key,
        value,
        patchable: Patchable.Flag.isSet(flags),
        unique: Unique.Flag.isSet(flags)
    };
}

function createBoolean<K extends string, F extends (Creatable.Flag | Patchable.Flag | Unique.Flag)[] = never[]>(key: K, flags?: F): {
    creatable: Creatable.Flag.IsSet<F>;
    patchable: Patchable.Flag.IsSet<F>;
} & Property<K, typeof Boolean> {
    return createPrimitive(key, Boolean, flags);
}

function createNumber<K extends string, F extends (Creatable.Flag | Patchable.Flag | Unique.Flag)[] = never[]>(key: K, flags?: F): {
    creatable: Creatable.Flag.IsSet<F>;
    patchable: Patchable.Flag.IsSet<F>;
    unique: Unique.Flag.IsSet<F>;
} & Property<K, typeof Number> {
    return createPrimitive(key, Number, flags);
}

function createString<K extends string, F extends (Creatable.Flag | Patchable.Flag | Unique.Flag)[] = never[]>(key: K, flags?: F): {
    creatable: Creatable.Flag.IsSet<F>;
    patchable: Patchable.Flag.IsSet<F>;
    unique: Unique.Flag.IsSet<F>;
} & Property<K, typeof String> {
    return createPrimitive(key, String, flags);
}

function createReference<K extends string, V, F extends (Creatable.Flag | Patchable.Flag)[] = never[]>(key: K, value: V, flags?: F): {
    creatable: Creatable.Flag.IsSet<F>;
    patchable: Patchable.Flag.IsSet<F>;
} & Property<K, V> & Expandable {
    return {
        creatable: Creatable.Flag.isSet(flags),
        expandable: true,
        key,
        patchable: Patchable.Flag.isSet(flags),
        value
    };
}

function createReference2<K extends string, T extends new () => any, P extends Property, F extends (Creatable.Flag | Patchable.Flag)[] = never[]>(key: K, value: T, property: P, flags?: F): {
    creatable: Creatable.Flag.IsSet<F>;
    patchable: Patchable.Flag.IsSet<F>;
} & Property<K, InstanceType<T>> & Expandable {
    return {
        creatable: Creatable.Flag.isSet(flags),
        expandable: true,
        key,
        patchable: Patchable.Flag.isSet(flags),
        value: new value()
    };
}

function createChildren<K extends string, V, F extends (Creatable.Flag | Patchable.Flag)[] = never[]>(key: K, value: V, flags?: F): {
    creatable: Creatable.Flag.IsSet<F>;
    patchable: Patchable.Flag.IsSet<F>;
} & Property<K, V> & Expandable & Iterable {
    return {
        creatable: Creatable.Flag.isSet(flags),
        expandable: true,
        iterable: true,
        key,
        patchable: Patchable.Flag.isSet(flags),
        value
    };
}

type MakeSelected<T> = T extends Primitive ? T : Partial<T>;

export class TypePicker<T = {}, B = {}> {
    select<P extends Property>(
        _select: (type: Properties<T>) => P
    ): TypePicker<T, B & Record<P["key"], P & Selected<MakeSelected<P["value"]>>>>;

    select<P extends Property & Expandable, S>(
        _select: (type: Pick<T, Expandable.Keys<T>>) => P,
        _expand: (picker: TypePicker<P["value"]>) => TypePicker<P["value"], S>
    ): TypePicker<T, B & Record<P["key"], P & Selected<S>>>;

    select(...args: any[]) {
        return this;
    }

    // selectIf<P extends Selectable<any> & Property>(
    //     _select: (type: Pick<T, Selectable.Keys<T>>) => P
    // ): TypePicker<T, B & Record<P["key"], (P & Selected<P["selectable"]>) | undefined>> {
    //     return this as any;
    // }

    get(): B {
        return {} as any;
    }
}

class CountryType {
    constructor() {
        this.foo = 3;
    }

    foo: number;
    name = createString("name", ["patchable"]);
}

CountryType.prototype.foo;

/**
 * [thinky-think]
 *  - namespaces (system)
 *  - dto
 *  - composited / computed
 *  - filtering on mapped - how to translate to real loaded?
 */

export const EntitySourceTypeMetadataSymbol: unique symbol = Symbol();

export abstract class EntitySourceType {
    [EntitySourceTypeMetadataSymbol]: number;

    createString<K extends string, F extends (Creatable.Flag | Patchable.Flag | Unique.Flag)[] = never[]>(key: K, flags?: F): {
        creatable: Creatable.Flag.IsSet<F>;
        patchable: Patchable.Flag.IsSet<F>;
        unique: Unique.Flag.IsSet<F>;
    } & Property<K, typeof String> {
        return createString(key, flags);
    }

    createReference<K extends string, V, F extends (Creatable.Flag | Patchable.Flag)[] = never[]>(key: K, value: V, flags?: F): {
        creatable: Creatable.Flag.IsSet<F>;
        patchable: Patchable.Flag.IsSet<F>;
    } & Property<K, V> & Expandable {
        return createReference(key, value, flags);
    }

    createReference2<K extends string, T extends new () => any, F extends (Creatable.Flag | Patchable.Flag)[] = never[]>(key: K, value: T, flags?: F): {
        creatable: Creatable.Flag.IsSet<F>;
        patchable: Patchable.Flag.IsSet<F>;
    } & Property<K, T> & Expandable {
        return createReference(key, new value(), flags);
    }

    createReference_withIdSelector<K extends string, V, P extends Property, F extends (Creatable.Flag | Patchable.Flag)[] = never[]>(key: K, value: V, id: P, flags?: F): {
        creatable: Creatable.Flag.IsSet<F>;
        patchable: Patchable.Flag.IsSet<F>;
    } & Property<K, V> & Expandable {
        return createReference(key, value, flags);
    }
}

class ArtistType extends EntitySourceType {
    // album =  new ReferenceProperty("album", new AlbumType(), ["patchable"]);
    // album = this.createReference("album", new AlbumType(), ["patchable"]);
    album = this.createReference("album", new AlbumType(), ["patchable"]);
    albums = createChildren("albums", new AlbumType());
    // name = createString("name");
    name = this.createString("name")
    age = createString("age", ["creatable"]);
    country = this.createReference("country", new CountryType(), ["patchable"]);
    foo = this.createReference_withIdSelector("foo", new CountryType(), this.age);
}

class AlbumType extends EntitySourceType {
    artist = this.createReference("album", new ArtistType(), ["patchable"]);
    // artist = new ReferenceProperty("artist", new ArtistType(), ["patchable"]);
    name = createString("name", ["patchable"]);
    songs = createChildren("songs", new SongType(), ["creatable", "patchable"]);
}

class SongType {
    name = createString("name", ["creatable", "patchable"]);
    number = createNumber("number", ["creatable", "patchable"]);
}

let picker = new TypePicker<ArtistType>()
    .select(x => x.name)
    .select(x => x.album)
    .select(x => x.age)
    .select(x => x.album, q => q.select(x => x.songs))
    .select(x => x.album, q => q.select(x => x.songs, x => x.select(x => x.name)))
    .select(x => x.foo, q => q.select(x => x.name))
    ;

let selectedType = picker.get();
selectedType.name.selected;
selectedType.name.creatable;
selectedType.name.patchable;
selectedType.album.value;
selectedType.album.selected.songs.selected.number?.creatable;
// selectedType.album.selected.artist?.selected;

type Foo2 = SelectedType<ArtistType>;

function takesPickedArtistType(picked: SelectedType<ArtistType>) {
    picked.album?.selected.artist?.key;

    if (picked.age !== void 0) {
        picked.age.creatable;
    }
}

type Larifari = Properties<typeof selectedType>;

let larifari: Larifari = {
    ...selectedType
};


type SelectedInstance = Instance<typeof selectedType>;

type StringInstance = Instance<typeof String>;

let selectedInstance: SelectedInstance = {
    age: "64",
    name: "foo",
    // name: "foo",
    album: {
        songs: [
            {
                name: "foo"
            }
        ]
    },
    foo: {
        name: "123"
    }
};


abstract class EntityMixinType {

}

abstract class EntityMappedType {

}
