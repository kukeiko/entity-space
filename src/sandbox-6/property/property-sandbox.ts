export interface Property<N extends string> {
    name: N;
}

export interface Selectable<S> {
    selectable: S;
}

export module Selectable {
    export type Keys<T> = ({ [K in keyof T]: T[K] extends Selectable<any> ? K : never })[keyof T];
}

export interface Selected<S> {
    selected: S;
}

export interface Expandable<E> {
    expandable: E;
}

export module Expandable {
    export type Keys<T> = ({ [K in keyof T]: T[K] extends Expandable<any> ? K : never })[keyof T];
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

export class StringProperty<N extends string, F extends (Creatable.Flag | Patchable.Flag | Unique.Flag)[] = never[]>
    implements Selectable<typeof String>, Property<N> {
    constructor(name: N, flags?: F) {
        this.name = name;
        this.creatable = Creatable.Flag.isSet(flags);
        this.patchable = Patchable.Flag.isSet(flags);
        this.unique = Unique.Flag.isSet(flags);
    }

    name: N;
    selectable = String;
    creatable: Creatable.Flag.IsSet<F>;// Creatable.Flag extends F[number] ? true : false;
    patchable: Patchable.Flag.IsSet<F>;// extends F[number] ? true : false;
    unique: Unique.Flag.IsSet<F>;// extends F[number] ? true : false;
    // unique: Unique.Flag extends F[number] ? true : false;

    foo(): void {

    }
}

// let stringProperty = new StringProperty(["creatable", "patchable"]);
// let stringProperty = new StringProperty("string", ["patchable", "unique"]);
let stringProperty = new StringProperty("string", ["patchable"]);
stringProperty.creatable;
stringProperty.patchable;
stringProperty.unique;
stringProperty.name;

type Foo = typeof stringProperty extends Unique ? true : false;

// type Bar = Patchable.Flag[] extends typeof stringProperty["flags"] ? true : false;
// let quak = Creatable.Flag.isSet(stringProperty.flags);
function createReference<N extends string, E, F extends (Creatable.Flag | Patchable.Flag)[] = never[]>(name: N, expandable: E, flags?: F): {
    name: N;
    expandable: E;
    creatable: Creatable.Flag.IsSet<F>;
    patchable: Patchable.Flag.IsSet<F>;
} {
    return {
        name: name,
        expandable: expandable,
        creatable: Creatable.Flag.isSet(flags),
        patchable: Patchable.Flag.isSet(flags)
    };
}

export class ReferenceProperty<N extends string, E, F extends (Creatable.Flag | Patchable.Flag)[] = never[]>
    implements Expandable<E>, Property<N> {
    constructor(name: N, expandable: E, flags?: F) {
        this.name = name;
        this.expandable = expandable;
        this.creatable = Creatable.Flag.isSet(flags);
        this.patchable = Patchable.Flag.isSet(flags);
    }

    name: N;
    expandable: E;
    creatable: Creatable.Flag.IsSet<F>;
    patchable: Patchable.Flag.IsSet<F>;
}

export class ChildrenProperty<N extends string, E, F extends (Creatable.Flag | Patchable.Flag)[] = never[]>
    implements Property<N>, Expandable<E>, Iterable {
    constructor(name: N, expandable: E, flags?: F) {
        this.name = name;
        this.expandable = expandable;
        this.creatable = Creatable.Flag.isSet(flags);
        this.patchable = Patchable.Flag.isSet(flags);
    }

    name: N;
    expandable: E;
    iterable: true = true;
    creatable: Creatable.Flag.IsSet<F>;
    patchable: Patchable.Flag.IsSet<F>;
}

export class TypePicker<T = {}, B = {}> {
    select<P extends Selectable<any> & Property<any>>(
        _select: (type: Pick<T, Selectable.Keys<T>>) => P
    ): TypePicker<T, B & Record<P["name"], P & Selected<P["selectable"]>>> {
        return this as any;
    }

    selectIf<P extends Selectable<any> & Property<any>>(
        _select: (type: Pick<T, Selectable.Keys<T>>) => P
    ): TypePicker<T, B & Record<P["name"], (P & Selected<P["selectable"]>) | undefined>> {
        return this as any;
    }

    expand<P extends Expandable<any> & Property<any>, E>(
        _select: (type: Pick<T, Expandable.Keys<T>>) => P,
        _expand: (picker: TypePicker<P["expandable"]>) => TypePicker<P["expandable"], E>
    ): TypePicker<T, B & Record<P["name"], P & Expanded<E>>> {
        return this as any;
    }

    expandIf<P extends Expandable<any> & Property<any>, E>(
        _select: (type: Pick<T, Expandable.Keys<T>>) => P,
        _expand: (picker: TypePicker<P["expandable"]>) => TypePicker<P["expandable"], E>
    ): TypePicker<T, B & Record<P["name"], (P & Expanded<E>) | undefined>> {
        return this as any;
    }

    get(): B {
        return {} as any;
    }
}

class CountryType {
    name = new StringProperty("name", ["patchable"]);
}

export const EntitySourceTypeMetadataSymbol: unique symbol = Symbol();

export abstract class EntitySourceType {
    [EntitySourceTypeMetadataSymbol]: number;
}

abstract class EntityMixinType {

}

abstract class EntityMappedType {

}

class ArtistType {
    // album =  new ReferenceProperty("album", new AlbumType(), ["patchable"]);
    album = createReference("album", new AlbumType(), ["patchable"]);
    albums = new ChildrenProperty("albums", new AlbumType());
    name = new StringProperty("name");
    age = new StringProperty("age", ["creatable"]);
    country = new ReferenceProperty("country", new CountryType(), ["patchable"]);
}

class AlbumType {
    artist = createReference("album", new ArtistType(), ["patchable"]);
    // artist = new ReferenceProperty("artist", new ArtistType(), ["patchable"]);
    name = new StringProperty("name", ["patchable"]);
    songs = new ChildrenProperty("songs", new SongType(), ["creatable", "patchable"]);
}


class SongType {
    name = new StringProperty("name", ["creatable", "patchable"]);
}

let picker = new TypePicker<ArtistType>()
    .select(x => x.name)
    .selectIf(x => x.age)
    .expand(x => x.album, ts => ts.select(x => x.name))
    .expandIf(x => x.country, ts => ts.select(x => x.name))
    .expand(x => x.albums, ts => ts.select(x => x.name))
    ;

let selectedType = picker.get();
selectedType.country?.expandable.name;

picker.get().name.selected;
picker.get().name.creatable;
picker.get().name.patchable;

picker.get().album.expandable;
picker.get().album.expanded.name.patchable;

type OptionalPropertyKeys<T> = ({ [K in keyof T]: undefined extends T[K] ? (T[K] extends Property<any> | undefined ? K : never) : never })[keyof T];
type OptionalProperties<T> = { [K in OptionalPropertyKeys<T>]?: T[K]; };

type RequiredPropertyKeys<T> = ({ [K in keyof T]: T[K] extends Property<any> ? K : never })[keyof T];
type RequiredProperties<T> = { [K in RequiredPropertyKeys<T>]: T[K]; };

type Properties<T> = OptionalProperties<T> & RequiredProperties<T>;

type PickedType<T> = {
    [K in keyof Properties<T>]?
    : T[K] extends Selectable<any> ? T[K] & Selected<T[K]["selectable"]>
    : T[K] extends Expandable<any> ? T[K] & Expanded<PickedType<T[K]["expandable"]>>
    : never
};

type Foo2 = PickedType<ArtistType>;

let foo: Foo2 = {
    age: {
        creatable: true,
        foo: () => void 0,
        name: "age",
        patchable: false,
        selectable: String,
        selected: String,
        unique: false
    },
    album: {
        creatable: false,
        expandable: new AlbumType(),
        expanded: {

        },
        name: "album",
        patchable: true
    }
};

function takesPickedArtistType(picked: PickedType<ArtistType>) {
    if(picked.age !== void 0) {
        picked.age.creatable;
    }
}

type Larifari = Properties<typeof selectedType>;

let larifari: Larifari = {
    ...selectedType
};

type BoxPropertyValue<T, V>
    = T extends Nullable ? T extends Iterable ? V[] | null : V | null
    : T extends Iterable ? V[] : V;

type InstancedPropertyValue<T>
    = T extends Selected<any> ? BoxPropertyValue<T, ReturnType<T["selected"]>>
    : T extends Expanded<any> ? BoxPropertyValue<T, Instance<T["expanded"]>>
    : never;

type Instance<T> = { [K in keyof Properties<T>]: InstancedPropertyValue<T[K]>; };

type SelectedInstance = Instance<typeof selectedType>;

let selectedInstance: SelectedInstance = {
    age: void 0,
    country: {
        name: "foo"
    },
    name: "foo",
    album: {
        name: "foo"
    },
    albums: [
        {
            name: "foo"
        },
        {
            name: "bar"
        }
    ]
};
