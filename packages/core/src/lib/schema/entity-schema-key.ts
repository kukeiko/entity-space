import { buildDefaultIndexName } from "./functions/build-default-index-name.fn";
import { IEntitySchema, IEntitySchemaIndex } from "./schema.interface";

export class EntitySchemaKey implements IEntitySchemaIndex {
    constructor(entitySchema: IEntitySchema, path: string | string[], options?: { name?: string }) {
        this.entitySchema = entitySchema;
        this.path = Array.isArray(path) ? path.slice() : [path];
        this.name = options?.name;
    }

    private readonly entitySchema: IEntitySchema;
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
