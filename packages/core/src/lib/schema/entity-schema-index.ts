import { buildDefaultIndexName } from "./build-default-index-name.fn";
import { IEntitySchema, IEntitySchemaIndex } from "./schema.interface";

// [todo] there isn't really anything to bake here.
// so what do i name it do not conflict w/ the "EntitySchemaIndex" interface :?
// we could of course import the interface under a different name, but having
// two things with exact same name requires you to check where it is imported from
// when checking out other source code files that import a "EntitySchemaIndex"
//
// [update] not completely true, we could add a convenient "getProperties()" method,
// forcefully finding a place where it could be useful if one doesn't naturally pop up.
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
