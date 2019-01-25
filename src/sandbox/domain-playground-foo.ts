export type Dummy = null;
type Unbox<T> = T extends any[] ? T[number] : T;
type Box<T, A = T> = A extends any[] ? T[] : T;
type ExcludeVoid<T> = Exclude<T, void>;
type ExcludeNullsy<T> = Exclude<T, void | null>;
type ExcludeNull<T> = Exclude<T, null>;
type NullIfNull<T, U> = U extends null ? T | null : T;

interface Property {
    name: string;
}

interface DtoProperty extends Property {
    dtoName: string;
}

module DtoProperty {
    export interface Options {
        dtoName?: string;
    }
}

interface Local<T, D = any> extends DtoProperty {
    locality: "local";
}

module Local {
    export interface Options<T, D> extends DtoProperty.Options {
        fromDto?: (dtoValue: D) => T;
        toDto?: (value: T) => D;
    }
}

interface Navigation<T> extends DtoProperty {
    locality: "navigation";
}

module Navigation {
    export interface Options<_T> extends DtoProperty.Options {
        typeKey: string;
    }
}

type PropertyValueType<T> = T extends Local<infer R> | Navigation<infer R> ? R : never;

type LocalKeys<T> = ({ [P in keyof T]: T[P] extends Local<any> ? P : never; })[keyof T];
type Locals<T> = { [P in LocalKeys<T>]: T[P]; };
type SelectedLocals<T> = { [P in keyof Locals<T>]: T[P] extends Local<infer R> ? R : never; };
type NavigationKeys<T> = ({ [P in keyof T]: T[P] extends Navigation<any> ? P : never; })[keyof T];

type ComplexLocalKeys<T> = (
    {
        [P in keyof T]: T[P] extends Local<infer R>
        ? R extends number | string | Date | null | number[] | string[] ? never : P : never;
    }
)[keyof T];

type Instance<T, U = T> = {
    // [P in LocalKeys<U> | NavigationKeys<U>]
    [P in keyof U]
    // : U[P] extends Local<infer R> ? R
    : U[P] extends (undefined | Navigation<infer R>) ?  NullIfNull<Instance<R>, R> | undefined
    // : U[P] extends Navigation<infer R> ? NullIfNull<Instance<R>, R>
    : never;
};

interface ArticleType {
    title: Local<string>;
    // author: Navigation<AuthorType | null>;
    author: Navigation<AuthorType>;
    publishedAt: Local<Date>;
    related: Navigation<ArticleType[]>;
}

interface AuthorType {
    articles: Navigation<ArticleType[]>;
    bornAt: Local<Date, number>;
    diedAt: Local<Date | null, number | null>;
    name: Local<string>;
    sex: Local<"male" | "female">;
    metadata: Local<Metadata | null>;
}

interface User {
    id: Local<number>;
    name: Local<string>;
}

interface Metadata {
    createdBy: Navigation<User>;
    createdAt: Local<Date, number>;
}

type ComplexAuthorKeys = ComplexLocalKeys<AuthorType>;
type ExpandedBlueprint<B, K extends NavigationKeys<B>> = ExcludeNull<Unbox<PropertyValueType<B[K]>>>;
type SelectedValueType<B, K extends LocalKeys<B>> = PropertyValueType<B[K]>;
type WithExpandedDescribed<B, K extends NavigationKeys<B>, O, Q> = Record<K, NullIfNull<Box<O, PropertyValueType<B[K]>>, PropertyValueType<B[K]>>> & Q;
type WithOptionalExpandedDescribed<B, K extends NavigationKeys<B>, O, Q> = Record<K, NullIfNull<Box<O, PropertyValueType<B[K]>>, PropertyValueType<B[K]>> | undefined> & Q;

class BuiltType {
    selections!: string[];
    expansions!: BuiltType[];

    // [todo] add minus(), extract(), etc
}

type UndefinedRecord<K extends keyof any, T> = {
    [P in K]?: T;
};

class TypeBuilder<B, D = {}> {
    selectAll(): TypeBuilder<B, SelectedLocals<B> & D> {
        return this as any;
    }

    select<K extends LocalKeys<ExcludeNull<B>>, S = ExcludeNull<B>[K]>(k: K): TypeBuilder<B, Record<K, S> & D> {
        return this as any;
    }

    expand<K extends NavigationKeys<B>, E = PropertyValueType<B[K]>, O = {}>(k: K, _: (eq: TypeBuilder<E, {}>) => TypeBuilder<E, O>): TypeBuilder<B, Record<K, Navigation<NullIfNull<O, PropertyValueType<B[K]>>>> & D> {
        return this as any;
    }

    expandIf<K extends NavigationKeys<B>, E = PropertyValueType<B[K]>, O = {}>(flag: boolean, k: K, _: (eq: TypeBuilder<E, {}>) => TypeBuilder<E, O>): TypeBuilder<B, Record<K, undefined | Navigation<NullIfNull<O, PropertyValueType<B[K]>>>> & D> {
        return this as any;
    }

    buildType(): BuiltType {
        return null as any;
    }

    quak(): D[] {
        return [];
    }

    foo(): Instance<D>[] {
        return [];
    }
}

let articleTypeBuilder = (new TypeBuilder<ArticleType>())
    .select("title")
    // .execute()
    .expandIf(true, "author", q => q.select("bornAt").select("name").select("diedAt"))

    // .expand("author", q => q.selectAll().expand("articles", q => q.select("title")))
    // .expandIf(true, "related", q => q.selectAll())
    ;

let quakquak = articleTypeBuilder.quak();
let firstQuak = quakquak[0].author;

if (firstQuak !== undefined) {
    firstQuak.dtoName
}

let quak = articleTypeBuilder.foo();

quak.forEach(x => {
    // x.author.

    // if (x.author !== null) {
    //     x.author.bornAt;

    //     if (x.author.diedAt !== null) {
    //         x.author.diedAt.getTime();
    //     }
    // }
});
