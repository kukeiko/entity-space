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
        computed: true,
        computedFrom: {
            id: true,
            systemId: true
        },
        compute: x => `${x.id}@${x.systemId}`,
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
        computed: true,
        compute: x => `${x.systemName}@${x.systemZone}`,
        computedFrom: {
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
    numDigitsOfSystemId: {
        compute: x => x.systemId.length,
        computed: true,
        computedFrom: {
            systemId: true
        },
        key: "numDigitsOfSystemId",
        local: true,
        modifiers: {},
        primitiveType: Number,
        read: x => x.numDigitsOfSystemId,
        write: (x, v) => x.numDigitsOfSystemId = v
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