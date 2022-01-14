import { buildDefaultIndexName } from "./build-default-index-name.fn";
import { EntitySchema, EntitySchemaKey } from "./schema";

export class UnbakedEntitySchemaKey implements EntitySchemaKey {
    constructor(entitySchema: EntitySchema, path: string | string[], options?: { name?: string }) {
        this.entitySchema = entitySchema;
        this.path = Array.isArray(path) ? path.slice() : [path];
        this.name = options?.name;
    }

    private readonly entitySchema: EntitySchema;
    private readonly name?: string;
    private readonly path: string[];

    getName(): string {
        return this.name ?? buildDefaultIndexName(this.path);
    }

    getPath(): string[] {
        return this.path.slice();
    }

    isUnique(): boolean {
        return true;
    }
}
