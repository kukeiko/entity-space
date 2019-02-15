import { Type } from "./type";
import { Component } from "./component";
import { Instance } from "./instance";
import { Property } from "./property";
import { TypeMapper } from "./type-mapper";
import { Query } from "./query";

/***
 *    ██████╗  ██████╗ ███╗   ███╗ █████╗ ██╗███╗   ██╗
 *    ██╔══██╗██╔═══██╗████╗ ████║██╔══██╗██║████╗  ██║
 *    ██║  ██║██║   ██║██╔████╔██║███████║██║██╔██╗ ██║
 *    ██║  ██║██║   ██║██║╚██╔╝██║██╔══██║██║██║╚██╗██║
 *    ██████╔╝╚██████╔╝██║ ╚═╝ ██║██║  ██║██║██║ ╚████║
 *    ╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝
 */
export module Domain {
    export type TypeConstructionOptions<$T extends Type<$K>, $K extends string> =
        {
            $: {
                key: $K;
            }
        } & {
            [$P in Component.Property.Keys<$T>]?
            : $T[$P] extends Property.Reference<infer K, infer T, infer P, infer A> ? PropertyOptions.Reference<K, P, A>
            : never;
        };

    export module PropertyOptions {
        export type Reference<
            K extends string,
            P extends Component.Property<any, any>,
            A extends string> = {
                localKey: P["key"];
                type: "reference";
            } & (A extends K ? {} : { dtoKey: A; });
    }
}

type ArtistTypeConstructionOptions = Domain.TypeConstructionOptions<ArtistType, "artist">;
type Muzi = ArtistType["country"] extends Property.Reference<infer K, infer T, infer P, infer A> ? true : false;

let artistTypeConstructionOptions: ArtistTypeConstructionOptions = {
    $: {
        key: "artist"
    },
    country: {
        dtoKey: "Country",
        localKey: "countryId",
        type: "reference"
    }
};

export type ConstructionOptions<T> = {
    [K in Component.Property.Keys<T>]
    : ConstructionOptions.ChildrenOptions<T[K]>
    & ConstructionOptions.ReferenceOptions<T[K]>
    & ConstructionOptions.ReferenceIdOptions<T[K]>
    ;
};

module ConstructionOptions {
    export type ChildrenOptions<X> = X extends Property.Children<infer K, infer T, infer P, infer A>
        ? {
            parentIdKey: P;
        } : {};

    export type ReferenceOptions<X> = X extends Property.Reference<infer K, infer T, infer P, infer A>
        ? {
            localIdKey: P["key"];
        } & ModifierOptions<X> : {};

    export type ReferenceIdOptions<X> = X extends Property.Reference.Id<infer K, infer T, infer P, infer A, infer M>
        ? {
            otherKey: T["$"]["key"];
            otherIdKey: P;
        } & ModifierOptions<X> : {};

    export type ModifierOptions<X> = X extends Component.Property<infer K, infer V, infer M>
        ? (
            ("p" extends M ? { options: { p: true; }; } : {})
            & ("c" extends M ? { options: { c: true; }; } : {})
            & ("n" extends M ? { options: { n: true; }; } : {})
        ) : {};
}

export interface UserType extends Type<"user"> {
    id: Property.Id<"id", typeof Number, "Id">;
    name: Property.Primitive<"name", typeof String, "Name", string, "n">;

    createdById: Property.Reference.Id<"createdById", UserType, "id", "CreatedById", "n">;
    createdBy: Property.Reference<"createdBy", UserType, UserType["createdById"], "CreatedBy", "n">;

    changedAt: Property.Primitive<"changedAt", typeof String, "ChangedAt">;
    changedById: Property.Reference.Id<"changedById", UserType, "id", "ChangedById", "n">;
    changedBy: Property.Reference<"changedBy", UserType, UserType["changedById"], "ChangedBy", "n">;
}

export interface CountryType extends Type<"country"> {
    id: Property.Id<"id", typeof String>;
    name: Property.Primitive<"name", typeof String, "Name">;
    population: Property.Primitive<"population", typeof Number, "Population">;

    createdById: Property.Reference.Id<"createdById", UserType, "id", "CreatedById">;
    createdBy: Property.Reference<"createdBy", UserType, CountryType["createdById"], "CreatedBy">;

    changedAt: Property.Primitive<"changedAt", typeof String, "ChangedAt">;
    changedById: Property.Reference.Id<"changedById", UserType, "id", "ChangedById", "n">;
    changedBy: Property.Reference<"changedBy", UserType, CountryType["changedById"], "ChangedBy", "n">;
}

export interface ArtistType extends Type<"artist"> {
    globalId: Property.Id.Aggregate<"globalId", typeof String, ArtistType, "id" | "systemId">;
    id: Property.Primitive<"id", typeof Number, "Id", number>;
    name: Property.Primitive<"name", typeof String, "Name", string>;

    // systemId: Property.Primitive<"systemId", typeof Number, "SystemId", number, "n">;
    systemId: Property.Primitive.Aggregate<"systemId", typeof String, ArtistType, "systemName" | "systemZone">;

    systemName: Property.Primitive<"systemName", typeof String, "SystemName", string>;
    systemZone: Property.Primitive<"systemZone", typeof Number, "SystemZone", number>;

    createdAt: Property.Primitive<"createdAt", typeof String, "CreatedAt", number>;
    createdById: Property.Reference.Id<"createdById", UserType, "id", "CreatedById">;
    createdBy: Property.Reference<"createdBy", UserType, ArtistType["createdById"], "CreatedBy">;

    changedAt: Property.Primitive<"changedAt", typeof String, "ChangedAt">;
    changedById: Property.Reference.Id<"changedById", UserType, "id", "ChangedById", "n" | "p">;
    changedBy: Property.Reference<"changedBy", UserType, ArtistType["changedById"], "ChangedBy", "n">;

    parentId: Property.Reference.Id<"parentId", ArtistType, "globalId", "ParentId", "n">;
    parent: Property.Reference<"parent", ArtistType, ArtistType["parentId"], "Parent", "n">;

    albums: Property.Children<"albums", AlbumType, "artistId", "Albums">;
    // children: Child<"children", ArtistType, "parent">;
    // albums: Child<"albums", AlbumType[], "artist">;

    countryId: Property.Reference.Id<"countryId", CountryType, "id", "CountryId", "n">;
    country: Property.Reference<"country", CountryType, ArtistType["countryId"], "Country", "n">;
    // countryId: Reference.Id<"countryId", CountryType , "id", "CountryId">;
    // country: Reference<"country", CountryType , ArtistType["countryId"], "Country">;

    lalala: 3;
    // reviewIds: Reference.Id<"reviewIds", ReviewType[] | null, "id", "ReviewIds">;
    // reviews: Reference<"reviews", (ReviewType | null)[] | null>;
}

type ArtistPropertyKeys = Component.Property.Keys<ArtistType>;
type ArtistPropertyOptionalKeys = Component.Property.Keys.Optional<ArtistType>;
type ArtistDtoAliases = Component.Dto.Aliases<ArtistType>;
type ArtistLocalKeys = Component.Local.Keys<ArtistType>;
type ArtistParentValueType = Component.Property.ValueOf<ArtistType["parent"]>;
type ArtistIdViaAlias = Component.Dto.WithAlias<ArtistType, "Id">;
type ArtistInstance = Instance<ArtistType>;
type ArtistDtoInstance = Instance.Dto<ArtistType>;
type ArtistCountryValue = Component.Property.ValueOf<Component.Property.WithKey<ArtistType, "country">>;

export interface AlbumType extends Type<"album"> {
    id: Property.Id<"id", typeof Number, "Id">;
    artistId: Property.Reference.Id<"artistId", ArtistType, "globalId", "ArtistId", "n" | "p" | "c">;
    artist: Property.Reference<"artist", ArtistType, AlbumType["artistId"], "Artist", "n" | "p" | "c">;
}

export interface ReviewType extends Type<"review"> {
    id: Property.Id<"id", typeof Number>;
}


let artistCtorOptions: ConstructionOptions<ArtistType> = {
    albums: {
        parentIdKey: "artistId"
    },
    changedAt: {
        options: {

        }
    },
    changedBy: {
        localIdKey: "changedById",
        options: {
            n: true
        }
        // localIdKey: "changedById",
    },
    changedById: {
        options: {
            n: true,
            p: true
        },
        otherIdKey: "id",
        otherKey: "user"
        // otherIdKey: "id",
        // otherKey: "user"
    },
    country: {
        localIdKey: "countryId",
        options: {
            n: true
        }
    },
    countryId: {
        options: {
            n: true
        },
        otherIdKey: "id",
        otherKey: "country"
    },
    createdAt: {},
    createdBy: {
        localIdKey: "createdById"
    },
    createdById: {
        otherKey: "user",
        otherIdKey: "id"
    },
    globalId: {},
    id: {},
    name: {},
    parent: {
        localIdKey: "parentId",
        options: {
            n: true
        }
    },
    parentId: {
        options: {
            n: true
        },
        otherIdKey: "globalId",
        otherKey: "artist"
    },
    systemId: {

    },
    systemName: {},
    systemZone: {}
};

let countryCtorOptions: ConstructionOptions.ReferenceOptions<ArtistType["country"]> = {
    localIdKey: "countryId",
    options: {
        n: true
    }
};

let builtArtist: ArtistType = {
    lalala: 3,
    $: {
        key: "artist"
    },
    albums: {
        array: true,
        dtoKey: "Albums",
        external: true,
        key: "albums",
        navigable: true,
        navigated: null as any as AlbumType,
        modifiers: {},
        ordered: false,
        parentIdKey: "artistId",
        read: x => x.albums,
        readDto: x => x.Albums,
        write: (x, v) => x.albums = v,
        writeDto: (x, v) => x.Albums = v
    },
    id: null as any,
    // albums: {
    //     parentReference: null as any as AlbumType["artist"],
    //     navigable: true,
    //     navigated: null as any as AlbumType
    // },
    changedAt: {
        dtoKey: "ChangedAt",
        key: "changedAt",
        local: true,
        modifiers: {},
        primitiveType: String,
        fromDto: v => v,
        toDto: v => v,
        read: x => x.changedAt,
        readDto: x => x.ChangedAt,
        write: (x, v) => x.changedAt = v,
        writeDto: (x, v) => x.ChangedAt = v
    },
    changedBy: {
        dtoKey: "ChangedBy",
        external: true,
        key: "changedBy",
        localKey: null as any as ArtistType["changedById"],
        navigable: true,
        navigated: null as any as UserType,
        modifiers: {
            n: true
        },
        read: x => x.changedBy,
        readDto: x => x.ChangedBy,
        write: (x, v) => x.changedBy = v,
        writeDto: (x, v) => x.ChangedBy = v
    },
    changedById: {
        dtoKey: "ChangedById",
        key: "changedById",
        local: true,
        modifiers: {
            n: true,
            p: true
        },
        otherIdKey: "id",
        // otherIdKey: null as any as UserType["id"],
        read: x => x.changedById,
        readDto: x => x.ChangedById,
        write: (x, v) => x.changedById = v,
        writeDto: (x, v) => x.ChangedById = v
    },
    // children: {
    //     parentReference: null as any as ArtistType["parent"],
    //     navigable: true,
    //     navigated: null as any as ArtistType
    // },
    country: {
        dtoKey: "Country",
        external: true,
        key: "country",
        localKey: null as any as ArtistType["countryId"],
        navigable: true,
        navigated: null as any as CountryType,
        modifiers: {
            n: true,
        },
        read: x => x.country,
        readDto: x => x.Country,
        write: (x, v) => x.country = v,
        writeDto: (x, v) => x.Country = v
    },
    countryId: {
        dtoKey: "CountryId",
        key: "countryId",
        local: true,
        modifiers: {
            n: true
        },
        // otherIdKey: null as any as CountryType["id"],
        otherIdKey: "id",
        read: x => x.countryId,
        readDto: x => x.CountryId,
        write: (x, v) => x.countryId = v,
        writeDto: (x, v) => x.CountryId = v
    },
    createdAt: {
        dtoKey: "CreatedAt",
        key: "createdAt",
        local: true,
        modifiers: {},
        primitiveType: String,
        fromDto: v => v.toString(),
        toDto: v => +v,
        read: x => x.createdAt,
        readDto: x => x.CreatedAt,
        write: (x, v) => x.createdAt = v,
        writeDto: (x, v) => x.CreatedAt = v
    },
    createdBy: {
        dtoKey: "CreatedBy",
        external: true,
        key: "createdBy",
        localKey: null as any as ArtistType["createdById"],
        navigable: true,
        navigated: null as any as UserType,
        modifiers: {},
        read: x => x.createdBy,
        readDto: x => x.CreatedBy,
        write: (x, v) => x.createdBy = v,
        writeDto: (x, v) => x.CreatedBy = v
    },
    createdById: null as any,
    globalId: {
        aggregate: true,
        aggregatedFrom: {
            id: true,
            systemId: true
        },
        aggregateValue: x => `${x.id}@${x.systemId}`,
        id: true,
        key: "globalId",
        local: true,
        modifiers: {
            u: true
        },
        primitiveType: String,
        read: x => x.globalId,
        write: (x, v) => x.globalId = v
    },
    name: {
        dtoKey: "Name",
        key: "name",
        local: true,
        modifiers: {},
        primitiveType: String,
        fromDto: v => v.toString(),
        toDto: v => v,
        read: x => x.name,
        readDto: x => x.Name,
        write: (x, v) => x.name = v,
        writeDto: (x, v) => x.Name = v
    },
    parentId: {
        dtoKey: "ParentId",
        key: "parentId",
        local: true,
        modifiers: {
            n: true
        },
        // otherIdKey: null as any as ArtistType["id"],
        otherIdKey: "globalId",
        readDto: x => x.ParentId,
        writeDto: (u, v) => u.ParentId = v,
        read: x => x.parentId,
        write: (x, v) => x.parentId = v,
    },
    parent: {
        dtoKey: "Parent",
        key: "parent",
        localKey: null as any as ArtistType["parentId"],
        external: true,
        navigable: true,
        navigated: null as any as ArtistType,
        modifiers: {
            n: true
        },
        readDto: x => x.Parent,
        writeDto: (u, v) => u.Parent = v,
        read: x => x.parent,
        write: (x, v) => x.parent = v,
    },
    systemId: {
        aggregate: true,
        aggregateValue: x => `${x.systemName}@${x.systemZone}`,
        aggregatedFrom: {
            systemName: true,
            systemZone: true
        },
        key: "systemId",
        local: true,
        modifiers: {},
        primitiveType: String,
        read: x => x.systemId,
        write: (x, v) => x.systemId = v
    },
    systemName: {
        dtoKey: "SystemName",
        fromDto: x => x,
        key: "systemName",
        local: true,
        modifiers: {},
        primitiveType: String,
        read: x => x.systemName,
        readDto: x => x.SystemName,
        toDto: x => x,
        write: (x, v) => x.systemName = v,
        writeDto: (x, v) => x.SystemName = v,
    },
    systemZone: {
        dtoKey: "SystemZone",
        fromDto: x => x,
        key: "systemZone",
        local: true,
        modifiers: {},
        primitiveType: Number,
        read: x => x.systemZone,
        readDto: x => x.SystemZone,
        toDto: x => x,
        write: (x, v) => x.systemZone = v,
        writeDto: (x, v) => x.SystemZone = v,
    }
};

let artistDtoInstances: Instance.Dto<ArtistType[]> = [
    {
        Albums: [{

        }],
        ChangedAt: "2019",
        // Country: null,
        Country: {
            ChangedAt: "foo",
            ChangedBy: {
                ChangedAt: "2019",
                ChangedBy: null,
                ChangedById: 3,
                CreatedBy: null,
                CreatedById: 123,
                Id: 3,
                Name: "foo"
            },
            ChangedById: 123,
            CreatedBy: {
                ChangedAt: "2019",
                ChangedBy: null,
                ChangedById: null,
                CreatedBy: null,
                CreatedById: 3,
                Id: 3,
                Name: "foo"
            },
            CreatedById: 1,
            id: "at",
            Name: "Austria"
        },
        CountryId: "at",
        CreatedAt: 123,
        CreatedBy: null as any as Instance.Dto<UserType>,
        CreatedById: 1,
        Id: 2,
        ParentId: null,
        Parent: {
            Country: null,
            CountryId: null,
            ChangedAt: "2019",
            CreatedAt: 56,
            CreatedBy: null as any as Instance.Dto<UserType>,
            CreatedById: 1,
            Id: 2,
            Parent: null,
            // ReviewIds: [1, 2, 3],
            ParentId: null,
            ChangedById: null,
            ChangedBy: null
        },
        ChangedBy: null,
        ChangedById: null,
        Name: "susi",
        SystemName: "foo",
        SystemZone: 64
    }
];

let typeMapper = new TypeMapper<ArtistType>()
    .select(x => x.country, q => q.select(x => x.id))
    .selectIf(x => x.changedAt)
    .select(x => x.changedById)
    .select(x => x.albums, q => q
        .select(x => x.artistId)
        .select(x => x.artist, q => q
            .select(x => x.changedById)
            .select(x => x.country, q => q.select(x => x.name))
        )
    )
    .get();

if (typeMapper.changedAt !== undefined) {
    typeMapper.changedAt.selected;
}

typeMapper.country.selected.id;

let mappedArtist: Instance<typeof typeMapper> = {
    country: {
        id: "at"
    },
    changedAt: "2019-01-01",
    changedById: Math.random() > .5 ? 1 : null,
    albums: [
        {
            artist: {
                changedById: Math.random() > .5 ? 1 : null,
                country: {
                    name: "austria"
                }
            },
            artistId: Math.random() > .5 ? "foo" : null
        }
    ]
};

let mappedArtists: Instance<typeof typeMapper[]> = [
    {
        country: {
            id: "at"
        },
        changedAt: Math.random() > .5 ? "2019-01-01" : undefined,
        changedById: Math.random() > .5 ? 1 : null,
        albums: [
            {
                artist: {
                    changedById: Math.random() > .5 ? 1 : null,
                    country: {
                        name: "austria"
                    }
                },
                artistId: Math.random() > .5 ? "foo" : null
            }
        ]
    }
];

let artistFooQuery = new Query<ArtistType>()
    .select(x => x.country, x => x.select(x => x.id));


let builtMappedFooArtist = artistFooQuery.get();
// let builtMappedFooArtistInstances: Instance<typeof builtMappedFooArtist[]> = [
//     {

//     }
// ];

// let artistMapper = new TypeMapper<ArtistType>()
let artistMapper = new Query<ArtistType>()
    .select(x => x.globalId)
    .select(x => x.systemId)
    .select(x => x.createdAt, [
        x => x.fromTo(["2018-01-01", "2019-01-01"], false),
        x => x.to("1970-04-06")
    ])
    .selectIf(x => x.changedAt)
    .filter("createdAt", f => f.equals("foo").fromTo(["abc", "xyz"], [true, true]))
    .selectIf(x => x.id)
    .select(x => x.countryId)
    .select(x => x.changedById)
    .selectIf(x => x.albums, q => q.selectIf(x => x.artistId).select(x => x.artist, q => q.select(x => x.parentId)))
    .select(x => x.country, q => q
        .select(x => x.createdBy, q => q.select(x => x.name, [f => f.equals("susi")]))
        .select(x => x.name, [x => x.in(["austria", "germany", "hungary"])])
        .select(x => x.population)
    )
    .select(x => x.country, q => q
        .select(x => x.changedBy, q => q.select(x => x.id))
        .select(x => x.createdBy, q => q.select(x => x.id))
    )
    .select(x => x.country, q => q
        .select(x => x.changedBy, q => q.select(x => x.name))
    )
    .select(x => x.createdBy, q => q.select(x => x.id))
    .select(x => x.createdBy, q => q.select(x => x.id).select(x => x.name))
    .select(x => x.parent, q => q.select(x => x.country, q => q.select(x => x.createdById).select(x => x.id).select(x => x.name).select(x => x.createdBy, q => q.select(x => x.id).select(x => x.name))))
    .select(x => x.country, q => q.select(x => x.createdById).select(x => x.id).select(x => x.name))
    .select(x => x.country, q => q.select(x => x.name))
    .select(x => x.country, q => q.select(x => x.id).select(x => x.createdById))
    .select(x => x.country, q => q.select(x => x.createdBy, q => q))
    .select(x => x.country, q => q.select(x => x.createdBy, q => q.select(x => x.id)))
    .select(x => x.country, q => q.select(x => x.createdBy, q => q.select(x => x.name)))
    .selectIf(x => x.changedBy, q => q.selectIf(x => x.createdBy, q => q.select(x => x.name)))
    .filter("createdAt", f => f.to("123"))
    ;

let builtMappedArtist = artistMapper.get();
let builtMappedArtistInstances: Instance<typeof builtMappedArtist[]> = [
    {
        globalId: "foo@2",
        systemId: "2",
        // systemId: Math.random() > .5 ? null : "2",
        createdAt: "2016-02-05",
        changedAt: "2018-01-01",
        albums: [{
            artistId: null,
            artist: {
                parentId: null
            }
        }],
        changedById: null,
        changedBy: Math.random() > .5 ? null : undefined,
        countryId: null,
        createdBy: {
            id: 1,
            name: "foo"
        },
        country: {
            population: 64,
            changedBy: {
                id: 3,
                name: "foo"
            },
            createdBy: {
                id: 8,
                name: null
            },
            createdById: 8,
            id: "quak",
            name: "khaz"
        },
        parent: null
    }
];

let builtMappedArtistDtoInstances: Instance.Dto<(typeof builtMappedArtist)[]> = [
    {
        CreatedAt: 123,
        ChangedAt: "2018-01-01",
        Albums: [{
            // ArtistId: Math.random() > .5 ? "foo" : undefined,
            Artist: {
                ParentId: null
            }
        }],
        ChangedBy: null,
        ChangedById: null,
        Country: null,
        CountryId: null,
        CreatedBy: {
            Id: 1,
            Name: null
        },
        Id: undefined,
        Parent: {
            Country: {
                CreatedBy: {
                    Id: 3,
                    Name: "austria"
                },
                CreatedById: 3,
                id: "moo",
                Name: "foo"
            }
        },
        // SystemId: Math.random() > .5 ? null : 3
    }
];

function takesArtistInstance(artist: Instance<typeof builtMappedArtist>): void {
    if (artist.albums !== undefined) {
        artist.albums.forEach(album => {
            if (album.artist !== null) {
                album.artist.parentId;
            }
        });
    }

    artist.createdBy.id.toFixed();
    artist.changedById = null;

    if (artist.createdBy.name !== null) {
        artist.createdBy.name.charAt(1);
    }

    if (artist.id !== undefined) {
        if (artist.id !== null) {
            artist.id.toFixed();
        }
    }

    if (artist.changedBy != null) {
        if (artist.changedBy.createdBy != null) {
            if (artist.changedBy.createdBy.name !== null) {
                artist.changedBy.createdBy.name.charAt(1);
            }
        }
    }

    if (artist.parent !== null) {
        if (artist.parent.country !== null) {
            artist.parent.country.createdById.toFixed();
        }
    }

    if (artist.country !== null) {
        artist.country.createdById.toFixed();
        artist.country.createdBy.id.toFixed();

        if (artist.country.createdBy.name !== null) {
            artist.country.createdBy.name.charAt(1);
        }

        if (artist.country.changedBy !== null) {
            artist.country.changedBy.id.toFixed();

            if (artist.country.changedBy.name !== null) {
                artist.country.changedBy.name.charAt(1);
            }
        }
    }
}

function takesArtistDtoInstance(artist: Instance.Dto<typeof builtMappedArtist>): void {
    if (artist.Albums !== undefined) {
        artist.Albums.forEach(album => {
            if (album.Artist !== null) {
                album.Artist.ParentId;
            }
        });
    }

    artist.CreatedBy.Id.toFixed();

    if (artist.CreatedBy.Name !== null) {
        artist.CreatedBy.Name.charAt(1);
    }

    if (artist.Id !== undefined) {
        if (artist.Id !== null) {
            artist.Id.toFixed();
        }
    }

    // artist.ChangedBy = null;

    if (artist.ChangedBy != null) {
        if (artist.ChangedBy.CreatedBy != null) {
            if (artist.ChangedBy.CreatedBy.Name !== null) {
                artist.ChangedBy.CreatedBy.Name.charAt(1);
            }
        }
    }

    // artist.Parent = null;

    if (artist.Parent !== null) {
        if (artist.Parent.Country !== null) {
            artist.Parent.Country.CreatedById.toFixed();
        }
    }

    if (artist.Country !== null) {
        artist.Country.CreatedById.toFixed();
        artist.Country.CreatedBy.Id.toFixed();

        if (artist.Country.CreatedBy.Name !== null) {
            artist.Country.CreatedBy.Name.charAt(1);
        }

        if (artist.Country.ChangedBy !== null) {
            artist.Country.ChangedBy.Id.toFixed();

            if (artist.Country.ChangedBy.Name !== null) {
                artist.Country.ChangedBy.Name.charAt(1);
            }
        }
    }
}
