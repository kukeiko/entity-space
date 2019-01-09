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

interface ArticleType {
    title: Local<string>;
    author: Navigation<AuthorType | null>;
}

interface AuthorType {
    articles: Navigation<ArticleType[]>;
    bornAt: Local<Date, number>;
    diedAt: Local<Date | null, number | null>;
    name: Local<string>;
    sex: Local<"male" | "female">;
}

function define<T>(def: {
    locals: { [K in LocalKeys<T>]: T[K] extends Local<infer RT, infer RD> ? Local.Options<RT, RD> : never; },
    navigations: { [K in NavigationKeys<T>]: T[K] extends Navigation<infer R> ? Navigation.Options<R> : never; }
}): T {
    return null as any;
}

class Domain<T> {
    types: T = {} as any;

    add<B, K extends string>(name: K, blueprint: B): Domain<Record<K, B> & T> {
        return this as any;
    }

    isRegistered(typeKey: any): typeKey is keyof T {
        return typeKey in this.types;
    }
}

let domain = (new Domain())
    .add("author", define<AuthorType>({
        locals: {
            bornAt: {
                dtoName: "BornAt",
                fromDto: seconds => new Date(seconds * 1000),
                toDto: date => Math.round(date.getTime() / 1000)
            },
            diedAt: {
                dtoName: "DiedAt",
                fromDto: seconds => seconds === null ? null : new Date(seconds * 1000),
                toDto: date => date === null ? null : Math.round(date.getTime() / 1000)
            },
            name: {},
            sex: {}
        },
        navigations: {
            articles: {
                dtoName: "Articles",
                typeKey: "article"
            }
        }
    }))
    .add("article", define<ArticleType>({
        locals: {
            title: {}
        },
        navigations: {
            author: {
                dtoName: "Author",
                typeKey: "author"
            }
        }
    }));


/**
 * B => Blueprint
 * K => Key
 * O => Output
 * Q => Queried
 */
type ExpandedBlueprint<B, K extends NavigationKeys<B>> = ExcludeNull<Unbox<PropertyValueType<B[K]>>>;
type SelectedValueType<B, K extends LocalKeys<B>> = PropertyValueType<B[K]>;
type WithExpandedDescribed<B, K extends NavigationKeys<B>, O, Q> = Record<K, NullIfNull<Box<O, PropertyValueType<B[K]>>, PropertyValueType<B[K]>>> & Q;

class TypeDescriptor<B, D = {}> {
    selectAll(): TypeDescriptor<B, SelectedLocals<B> & D> {
        return this as any;
    }

    select<K extends LocalKeys<B>, S = SelectedValueType<B, K>>(k: K): TypeDescriptor<B, Record<K, S> & D> {
        return this as any;
    }

    expand<K extends NavigationKeys<B>, E = ExpandedBlueprint<B, K>, O = {}>(k: K, _: (eq: TypeDescriptor<E, {}>) => TypeDescriptor<E, O>): TypeDescriptor<B, WithExpandedDescribed<B, K, O, D>> {
        return this as any;
    }

    describe(): D {
        return null as any;
    }
}

let articleForMapping = (new TypeDescriptor<ArticleType>())
    .select("title")
    // .expand("author", q => q.select("bornAt").select("name").select("diedAt"))
    .expand("author", q => q.selectAll().expand("articles", q => q.select("title")))
    .describe();

class ArticleMapper {
    toViewModel(articles: typeof articleForMapping[]) {
        articles.forEach(article => {
            if (article.author !== null) {
                article.author.articles[0].title;

                let foo = article.author.bornAt;
                let diedAt = article.author.diedAt;

                if (diedAt !== null) {
                    diedAt.getDate();
                }
            }
        });
    }
}

// class ExpansionQuery<B, Q = {}> {
//     select<K extends LocalKeys<B>, S = SelectedValueType<B, K>>(k: K): ExpansionQuery<B, Record<K, S> & Q> {
//         return this as any;
//     }

//     expand<K extends NavigationKeys<B>, E = ExpandedBlueprint<B, K>, O = {}>(k: K, _: (eq: ExpansionQuery<E, {}>) => ExpansionQuery<E, O>): ExpansionQuery<B, WithExpandedDescribed<B, K, O, Q>> {
//         return this as any;
//     }
// }

// class RootQuery<B, Q = {}> {
//     select<K extends LocalKeys<B>, S = SelectedValueType<B, K>>(k: K): RootQuery<B, Record<K, S> & Q> {
//         return this as any;
//     }

//     expand<K extends NavigationKeys<B>, E = ExpandedBlueprint<B, K>, O = {}>(k: K, _: (eq: ExpansionQuery<E, {}>) => ExpansionQuery<E, O>): RootQuery<B, WithExpandedDescribed<B, K, O, Q>> {
//         return this as any;
//     }

//     execute(): Q[] {
//         return null as any;
//     }
// }

// let articles = (new RootQuery<ArticleType>())
//     .select("title")
//     .expand("author", q => q.select("name").select("sex"))
//     // .expand("author", q => q.select("name"))
//     // .expand("author", q => q.select("sex"))
//     .expand("author", q => q.expand("articles", q => q.select("title").expand("author", q => q.select("name").select("sex"))))
//     .execute();


// articles.forEach(article => {
//     if (article.author !== null) {
//         let firstAuthorArticle = article.author.articles[0];
//         let title = firstAuthorArticle.title;
//         let sex = article.author.sex;

//         if (firstAuthorArticle.author !== null) {
//             // firstAuthorArticle.author.s
//         }

//         article.author.name;
//     }

//     let a = article.title.at(0);
// });

// export type ExcludeVoid<T> = Exclude<T, void>;
// export type ExcludeNullsy<T> = Exclude<T, void | null>;
// export type Expandables<T> = ({ [P in keyof T]-?: T[P] extends Entity[] | undefined ? P : T[P] extends Entity | undefined | null ? P : never; })[keyof T];

// export class ExpansionQuery<T> {
//     expand<K extends Expandables<T>, E = ExcludeNullsy<T[K]>, X = Unbox<E>, R = X>(k: K, _?: (eq: ExpansionQuery<X>) => ExpansionQuery<R>): ExpansionQuery<Record<K, Box<R, E>> & T> {
//         return this as any;
//     }
// }

// export class RootQuery<T> {
//     // expand<K extends Expandables<T>, E = ExcludeVoid<T[K]>, X = Unbox<E>, R = X>(k: K, _?: (eq: ExpansionQuery<X>) => ExpansionQuery<R>): RootQuery<Record<K, Box<R, E>> & T>;
//     expand<K extends Expandables<T>, E = ExcludeNullsy<T[K]>, X = Unbox<E>, R = X>(k: K, _?: (eq: ExpansionQuery<X>) => ExpansionQuery<R>): RootQuery<Record<K, Box<R, E>> & T>;
//     expand(...args: any[]): any {
//         return this as any;
//     }

//     execute(): T[] {
//         return null as any;
//     }
// }



// interface Domain {
//     types: { [k: string]: any };
// }

// function domainAdd<D extends Domain, T, N extends string>(domain: D, type: T, name: N): Domain & { types: Record<N, T> } {
//     return null as any;
// }

// interface Address {
//     city?: string;
//     postalCode?: number;
// }




// let domain: Domain = {
//     types: {}
// };

// let quak = domainAdd(domain, {} as Address, "address");


// interface Definition {
//     references: {
//         [key: string]: {
//             type: () => any;
//         }
//     }
// }

// function declare<D extends Definition>(def: D): { [K in keyof D["references"]]: ReturnType<D["references"][K]["type"]> } {
//     return null as any;
// }

// function define<X, D extends Definition>(type: X, def: D): { [K in keyof D["references"]]: ReturnType<D["references"][K]["type"]> } & X {
//     return null as any;
// }

// let foo = declare({
//     references: {
//         "bar": {
//             type: () => bar
//         }
//     }
// });

// let bar = declare({
//     references: {
//         // "foo": {
//         //     type: () => foo
//         // }
//     }
// });

// let bar2 = define(bar, { references: { "foo": { type: () => foo } } });

// // bar



// type ObjectDescriptor<D, M> = {
//     data?: D;
//     methods?: M & ThisType<D & M>;  // Type of 'this' in methods is D & M
// };

// function makeObject<D, M>(desc: ObjectDescriptor<D, M>): D & M {
//     let data: object = desc.data || {};
//     let methods: object = desc.methods || {};
//     return { ...data, ...methods } as D & M;
// }

// let obj = makeObject({
//     data: { x: 0, y: 0 },
//     methods: {
//         moveBy(dx: number, dy: number) {
//             this.x += dx;  // Strongly typed this
//             this.y += dy;  // Strongly typed this
//         }
//     }
// });

// obj.x = 10;
// obj.y = 20;
// obj.moveBy(5, 5);