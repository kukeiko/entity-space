import {
    Album,
    Artist,
    Folder,
    Product,
    RecordMetadata,
    Song,
    SongTag,
    Tag,
    Tree,
    User,
    WashingMachine,
} from "@entity-space/elements/testing";

export function createMetadata(
    createdById: number,
    updatedById?: number,
    createdAt?: string,
    updatedAt?: string,
): RecordMetadata {
    return {
        createdAt: createdAt ?? new Date().toISOString(),
        createdById,
        updatedById: updatedById ?? null,
        updatedAt: updatedAt ?? (updatedById ? new Date(Date.now() + 360 * 1000).toISOString() : null),
    };
}

const users: User[] = [
    { id: 1, name: "Admin", metadata: createMetadata(0) },
    { id: 2, name: "Susi Sonne", metadata: createMetadata(0) },
];

const tags: Tag[] = [];

const artists: Artist[] = [
    { namespace: "dev", id: 1, name: "Infected Mushroom", country: "Isreal", metadata: createMetadata(1, 1) },
    { namespace: "prod", id: 1, name: "Hedflux", country: "Scotland", metadata: createMetadata(1) },
    { namespace: "dev", id: 3, name: "Sunnexo", country: "Netherlands", metadata: createMetadata(2, 1) },
    { namespace: "dev", id: 4, name: "No Songs Artist", country: "Lazyland", metadata: createMetadata(3) },
];

const albums: Album[] = [
    { namespace: "dev", id: 1, name: "IM The Supervisor", artistId: 1, metadata: createMetadata(1) },
    { namespace: "dev", id: 2, name: "Converting Vegetarians II", artistId: 1, metadata: createMetadata(1) },
];

const songs: Song[] = [
    // Infected Mushroom
    {
        namespace: "dev",
        id: 10,
        artistId: 1,
        albumId: 1,
        name: "Frog Machine",
        duration: 370,
        metadata: createMetadata(3),
    },
    {
        namespace: "dev",
        id: 11,
        artistId: 1,
        albumId: 2,
        name: "Blue Swan 5",
        duration: 538,
        metadata: createMetadata(2),
    },
    {
        namespace: "dev",
        id: 12,
        artistId: 1,
        albumId: 2,
        name: "Animatronica",
        duration: 375,
        metadata: createMetadata(1),
    },
    // Hedflux
    {
        namespace: "prod",
        id: 20,
        artistId: 0,
        albumId: 0,
        name: "Sacralicious",
        duration: 446,
        metadata: createMetadata(1),
    },
    // Sunnexo
];

const songTags: SongTag[] = [];

const trees: Tree[] = [
    {
        id: 1,
        name: "Mighty Oak",
        metadata: createMetadata(1, 2),
        branches: [
            {
                metadata: createMetadata(2, 1),
                branches: [],
                leaves: [
                    {
                        color: "green",
                        metadata: createMetadata(2),
                    },
                    {
                        color: "green",
                        metadata: createMetadata(2, 1),
                    },
                ],
            },
            {
                metadata: createMetadata(1, 2),
                branches: [
                    {
                        metadata: createMetadata(1),
                        branches: [],
                        leaves: [
                            {
                                color: "orange",
                                metadata: createMetadata(2),
                            },
                        ],
                    },
                    {
                        metadata: createMetadata(1),
                        branches: [],
                        leaves: [
                            {
                                color: "orange",
                                metadata: createMetadata(2),
                            },
                            {
                                color: "green",
                                metadata: createMetadata(2),
                            },
                        ],
                    },
                ],
                leaves: [
                    {
                        color: "orange",
                        metadata: createMetadata(2, 1),
                    },
                ],
            },
        ],
    },
];

const folders: Folder[] = [
    {
        id: 1,
        name: "music",
        parentId: null,
        metadata: createMetadata(1),
    },
    {
        id: 2,
        name: "Morcheeba",
        parentId: 1,
        metadata: createMetadata(2, 1),
    },
    {
        id: 3,
        name: "Deep Dive",
        parentId: 2,
        metadata: createMetadata(2, 1),
    },
];

const products: Product[] = [];
const washingMachines: WashingMachine[] = [];

export interface TestEntities {
    users: User[];
    artists: Artist[];
    albums: Album[];
    songs: Song[];
    songTags: SongTag[];
    tags: Tag[];
    trees: Tree[];
    folders: Folder[];
    products: Product[];
    washingMachines: WashingMachine[];
}

export const defaultEntities: TestEntities = {
    users,
    artists,
    albums,
    songs,
    tags,
    songTags,
    trees,
    folders,
    products,
    washingMachines,
};
