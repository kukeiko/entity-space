export type SchemaIndexValueV1 = number | number[] | string | string[];
type Entity = Record<string, any>;

export interface SchemaIndexOptionsArgumentV1 {
    unique?: boolean;
}

/**
 * [todo] not happy having "read index values" functionality in the Schema itself.
 * i did have to extract it out of the ObjectStoreIndex because we need indexes on entities
 * that are not separately stored; therefore need no ObjectStore, and so there's no ObjectStoreIndex.
 */
export class SchemaIndexV1<T extends number | string = number | string> {
    constructor(name: string, path: string | string[], options?: SchemaIndexOptionsArgumentV1) {
        this.name = name;

        if (typeof path === "string") {
            this.path = Object.freeze([path]);
        } else {
            this.path = Object.freeze(path.slice());
        }

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
