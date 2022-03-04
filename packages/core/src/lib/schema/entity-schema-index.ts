import { buildDefaultIndexName } from "./build-default-index-name.fn";
import { IEntitySchema, IEntitySchemaIndex } from "./schema.interface";

export class EntitySchemaIndex implements IEntitySchemaIndex {
    constructor(
        entitySchema: IEntitySchema,
        path: string | string[],
        options?: { name?: string; unique?: boolean; multiEntry?: boolean }
    ) {
        this.entitySchema = entitySchema;
        this.name = options?.name;
        this.path = Array.isArray(path) ? path.slice() : [path];
        this.unique = options?.unique ?? false;
        this.multiEntry = options?.multiEntry ?? false;
    }

    private readonly entitySchema: IEntitySchema;
    private readonly name?: string;
    private readonly unique: boolean;
    private readonly multiEntry: boolean;
    private readonly path: string[];

    getName(): string {
        return this.name ?? buildDefaultIndexName(this.path);
    }

    getPath(): string[] {
        return this.path.slice();
    }

    isUnique(): boolean {
        return this.unique;
    }
}
