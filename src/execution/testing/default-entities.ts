import { Album, Artist, RecordMetadata, Song, Tag, User } from "@entity-space/elements/testing";

const createMetadata = (createdById: number, updatedById?: number): RecordMetadata => ({
    createdAt: new Date().toISOString(),
    createdById,
    updatedById,
    updatedAt: updatedById ? new Date(Date.now() + 360 * 1000).toISOString() : undefined,
});

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

export interface TestEntities {
    users: User[];
    artists: Artist[];
    albums: Album[];
    songs: Song[];
    tags: Tag[];
}

export const defaultEntities: TestEntities = { users, artists, albums, songs, tags };
