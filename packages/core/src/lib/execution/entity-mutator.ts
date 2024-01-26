import { Entity } from "../common/entity.type";
import { EntityBlueprintInstance } from "../schema/entity-blueprint-instance.type";
import { IEntitySchema } from "../schema/schema.interface";

export type CreateOneEntityFn<T = Entity> = (entity: EntityBlueprintInstance<T>) => Promise<EntityBlueprintInstance<T>>;
export type UpdateOneEntityFn<T = Entity> = (entity: EntityBlueprintInstance<T>) => Promise<EntityBlueprintInstance<T>>;
export type DeleteOneEntityFn<T = Entity> = (entity: EntityBlueprintInstance<T>) => Promise<void>;
export type CreateManyEntitiesFn<T = Entity> = (
    entities: EntityBlueprintInstance<T>[]
) => Promise<EntityBlueprintInstance<T>[]>;
export type UpdateManyEntitiesFn<T = Entity> = (
    entities: EntityBlueprintInstance<T>[]
) => Promise<EntityBlueprintInstance<T>[]>;
export type DeleteManyEntitiesFn<T = Entity> = (entities: EntityBlueprintInstance<T>[]) => Promise<void>;

export class EntityMutator<T = Entity> {
    constructor(schema: IEntitySchema) {
        this.schema = schema;
    }

    private readonly schema: IEntitySchema;
    private createOneFn?: CreateOneEntityFn<T>;
    private createManyFn?: CreateManyEntitiesFn<T>;
    private updateOneFn?: UpdateOneEntityFn<T>;
    private updateManyFn?: UpdateManyEntitiesFn<T>;
    private deleteOneFn?: DeleteOneEntityFn<T>;
    private deleteManyFn?: DeleteManyEntitiesFn<T>;

    setCreateOne(createOneFn: CreateOneEntityFn<T>): void {
        this.createOneFn = createOneFn;
    }

    setCreateMany(createManyFn: CreateManyEntitiesFn<T>): void {
        this.createManyFn = createManyFn;
    }

    setUpdateOne(updateOneFn: UpdateOneEntityFn<T>): void {
        this.updateOneFn = updateOneFn;
    }

    setUpdateMany(updateManyFn: UpdateManyEntitiesFn<T>): void {
        this.updateManyFn = updateManyFn;
    }

    setDeleteOne(deleteOneFn: DeleteOneEntityFn<T>): void {
        this.deleteOneFn = deleteOneFn;
    }

    setDeleteMany(deleteManyFn: DeleteManyEntitiesFn<T>): void {
        this.deleteManyFn = deleteManyFn;
    }

    createOne(entity: EntityBlueprintInstance<T>): Promise<EntityBlueprintInstance<T>> {
        if (!this.createOneFn) {
            throw new Error(`${this.createOne.name}() is not implemented for schema ${this.schema.getId()}`);
        }

        return this.createOneFn(entity);
    }

    createMany(entities: EntityBlueprintInstance<T>[]): Promise<EntityBlueprintInstance<T>[]> {
        if (!this.createOneFn) {
            throw new Error(`${this.createMany.name}() is not implemented for schema ${this.schema.getId()}`);
        }

        return this.createMany(entities);
    }

    updateOne(entity: EntityBlueprintInstance<T>): Promise<EntityBlueprintInstance<T>> {
        if (!this.updateOneFn) {
            throw new Error(`${this.updateOne.name}() is not implemented for schema ${this.schema.getId()}`);
        }

        return this.updateOneFn(entity);
    }

    updateMany(entities: EntityBlueprintInstance<T>[]): Promise<EntityBlueprintInstance<T>[]> {
        if (!this.updateManyFn) {
            throw new Error(`${this.updateMany.name}() is not implemented for schema ${this.schema.getId()}`);
        }

        return this.updateManyFn(entities);
    }

    deleteOne(entity: EntityBlueprintInstance<T>): Promise<void> {
        if (!this.deleteOneFn) {
            throw new Error(`${this.deleteOne.name}() is not implemented for schema ${this.schema.getId()}`);
        }

        return this.deleteOneFn(entity);
    }

    deleteMany(entities: EntityBlueprintInstance<T>[]): Promise<void> {
        if (!this.deleteManyFn) {
            throw new Error(`${this.deleteMany.name}() is not implemented for schema ${this.schema.getId()}`);
        }

        return this.deleteManyFn(entities);
    }
}
