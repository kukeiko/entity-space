import { ArtistType, AlbumType, UserType, CountryType } from "../user";

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
    systemArtistId: null as any,
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
        localKey: "changedById",
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
        primitiveType: Number,
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
        localKey: "countryId",
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
        primitiveType: String,
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
        localKey: "createdById",
        navigable: true,
        navigated: null as any as UserType,
        modifiers: {},
        read: x => x.createdBy,
        readDto: x => x.CreatedBy,
        write: (x, v) => x.createdBy = v,
        writeDto: (x, v) => x.CreatedBy = v
    },
    createdById: null as any,
    id: {
        computed: true,
        computedFrom: {
            systemArtistId: true,
            systemId: true
        },
        compute: x => `${x.systemArtistId}@${x.systemId}`,
        id: true,
        key: "id",
        local: true,
        modifiers: {
            u: true
        },
        primitiveType: String,
        read: x => x.id,
        write: (x, v) => x.id = v
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
        compute: x => `${x.systemArtistId}@${x.systemId}`,
        computed: true,
        computedFrom: {
            systemArtistId: true,
            systemId: true
        },
        key: "parentId",
        local: true,
        modifiers: {
            n: true
        },
        otherIdKey: "id",
        primitiveType: String,
        read: x => x.parentId,
        write: (x, v) => x.parentId = v
    },
    parent: {
        dtoKey: "Parent",
        key: "parent",
        localKey: "parentId",
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
    reviewIds: {
        array: true,
        dtoKey: "ReviewIds",
        fromDto: x => x,
        key: "reviewIds",
        local: true,
        modifiers: {},
        ordered: false,
        primitiveType: Number,
        read: x => x.reviewIds,
        readDto: x => x.ReviewIds,
        toDto: x => x,
        write: (x, v) => x.reviewIds = v,
        writeDto: (x, v) => x.ReviewIds = v
    },
    systemId: {
        computed: true,
        compute: x => `${x.systemName}@${x.systemZone}`,
        computedFrom: {
            systemName: true,
            systemZone: true
        },
        key: "systemId",
        local: true,
        modifiers: {
            n: true
        },
        primitiveType: String,
        read: x => x.systemId,
        write: (x, v) => x.systemId = v
    },
    numDigitsOfSystemId: {
        compute: x => x.systemId !== null ? x.systemId.length : null,
        computed: true,
        computedFrom: {
            systemId: true
        },
        key: "numDigitsOfSystemId",
        local: true,
        modifiers: {
            n: true
        },
        primitiveType: Number,
        read: x => x.numDigitsOfSystemId,
        write: (x, v) => x.numDigitsOfSystemId = v
    },
    systemName: {
        ethereal: true,
        key: "systemName",
        local: true,
        modifiers: {
            n: true
        },
        primitiveType: String,
        read: x => x.systemName,
        write: (x, v) => x.systemName = v
    },
    systemZone: {
        ethereal: true,
        key: "systemZone",
        local: true,
        modifiers: {},
        primitiveType: Number,
        read: x => x.systemZone,
        write: (x, v) => x.systemZone = v
    }
};