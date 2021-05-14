export type NamespaceId = "earth" | "moon" | "mars" | "europa" | "nether";

export interface Namespace {
    id: NamespaceId;
    name: string;
}

export interface NamespacedRecord {
    id: string; // fully qualified id (localId + namespace) - i.e. "earth-4672"
    localId: number; // db entry id that is unique within a namespace (because that namespace has its own db)
    namespaceId: NamespaceId;
    namespace?: Namespace;
}

export interface AuditableRecord {
    createdAt: string;
    createdByUserLocalId: number;
    createdByUserNamespaceId: NamespaceId;
}

export interface Album extends NamespacedRecord, AuditableRecord {
    name: string;
}

export interface User extends NamespacedRecord {
    name: string;
}
