export class EntityTypeMetadata<T extends Entity<T>> {
    class!: EntityType<T>;
}

export module EntityTypeMetadata {
    export interface CtorArgs<T extends Entity<T>> {

    }
}

export interface EntityType<T extends Entity<T>> {
    new(metadata: EntityMetadata<T>): T;
    prototype: T;
    create(metadata: EntityTypeMetadata<T>): T;
}

export class EntityMetadata<T extends Entity<T>> {
    type: EntityTypeMetadata<T>;
    hydration!: any;

    constructor(type: EntityTypeMetadata<T>) {
        this.type = type;
    }
}

// export abstract class Entity<T extends Entity<T> = any> {
export abstract class Entity<T extends Entity<T> = any> {
    $: EntityMetadata<T>;

    constructor(metadata: EntityMetadata<T>) {
        this.$ = metadata;
    }

    create(): T {
        return this.$.type.class.create(this.$.type);
    }

    static create<T extends Entity<T> = T>(typeMetadata: EntityTypeMetadata<T>): T {
        return new typeMetadata.class(new EntityMetadata(typeMetadata));
    }
}

export function Declare<T extends Entity<T> = any>(args?: Partial<EntityTypeMetadata.CtorArgs<T>>) {
    return (type: EntityType<T>): void => {
        // let existing = getOrCreateMetadataArgs(type);
        // existing.sorter = (args || {}).sorter || null;

        // if (!args) return;

        // existing.primaryKey = args.primaryKey || existing.primaryKey;
        // existing.primitives = { ...existing.primitives, ...(args.primitives || {}) };
        // existing.dates = { ...existing.dates, ...(args.dates || {}) };
        // existing.complexes = { ...existing.complexes, ...(args.complexes || {}) };
        // existing.instances = { ...existing.instances, ...(args.instances || {}) };
        // existing.references = { ...existing.references, ...(args.references || {}) };
        // existing.children = { ...existing.children, ...(args.children || {}) };
        // existing.collections = { ...existing.collections, ...(args.collections || {}) };
    };
}
