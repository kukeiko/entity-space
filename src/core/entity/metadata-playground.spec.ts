// [todo] naming conflict w/ model/property
interface Property {
    key: string;
    // type: "number" | "string" | "boolean";
}

export interface Metadata {
    // in open-api context, its the uri. in indexeddb, its going to be the object store name.
    // we may want to split it up at some point - let's see.
    name: string;
    // properties: Record<string, Property>;
    key: string[];
    indexes?: string[];
}

xdescribe("playground: metadata", () => {
    it("foo", () => {});
});
