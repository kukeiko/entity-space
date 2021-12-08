// import { Property } from "./property";

export interface Index {
    paths: string[];
    unique?: boolean;
    multiEntry?: boolean;
}

export type SchemaKey = string[];

export type SchemaIndexes = Record<string, Index>;

export interface Schema<T = any> {
    // in open-api context, its the uri. in indexeddb, its going to be the object store name.
    // we may want to split it up at some point - let's see.
    name: string;
    // properties: Record<keyof T, Property>;
    keys: string[];
    indexes?: Record<string, Index>;
}

// const db: IDBDatabase = {} as any;

// const myStore = db.createObjectStore("foo");
// myStore.createIndex("", "", { multiEntry: true });

// const tx = db.transaction("foo", "readonly");
// tx.objectStore;
// tx.oncomplete = () => {
//     tx.objectStore("foo").get;
//     // event.target.result as
// };
