export type SchemaIndexValue = number | number[] | string | string[];
type Entity = Record<string, any>;

/**
 * [todo] not happy having "read index values" functionality in the Schema itself.
 * i did have to extract it out of the ObjectStoreIndex because we need indexes on entities
 * that are not separately stored; therefore need no ObjectStore, and so there's no ObjectStoreIndex.
 */
export class SchemaIndex<T extends number | string = number | string> {
    constructor(name: string, path: string[], options?: { unique?: boolean }) {
        this.name = name;
        this.path = Object.freeze(path.slice());
        this.unique = options?.unique ?? false;
    }

    readonly name: string;
    readonly path: readonly string[];
    readonly unique: boolean;

    read(entities: Entity[]): T[][] {
        return entities.map(item => this.readOne(item));
    }

    readOne(entity: Entity): T[] {
        const key: T[] = [];

        for (const keyPathPart of this.path) {
            key.push(this.readPart(entity, keyPathPart));
        }

        return key;
    }

    private readPart(item: Entity, keyPathPart: string): T {
        const parts = keyPathPart.split(".");
        let value = item;

        for (const part of parts) {
            value = value[part];
        }

        if (typeof value !== "string" && typeof value !== "number") {
            throw new Error(`index "${keyPathPart}" did not evaluate to a string or number`);
        }

        return value;
    }
}