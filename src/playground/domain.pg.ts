import { ConstructionOptions } from "../sandbox";
import { ArtistType } from "../user";

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
        otherIdKey: "id",
        otherKey: "artist"
    },
    systemArtistId: {},
    systemId: {

    },
    numDigitsOfSystemId: {},
    reviewIds: {},
    systemName: {},
    systemZone: {}
};

let countryCtorOptions: ConstructionOptions.ReferenceOptions<ArtistType["country"]> = {
    localIdKey: "countryId",
    options: {
        n: true
    }
};