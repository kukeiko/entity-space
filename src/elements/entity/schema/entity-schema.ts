import type { Path } from "@entity-space/utils";
import type { Entity } from "../entity";
import type { ConcreteEntitySchema } from "./concrete-entity-schema";
import type { EntityComputedProperties } from "./entity-computed-properties";
import type { EntityPrimitiveProperty } from "./entity-primitive-property";
import type { EntityProperty } from "./entity-property";
import type { EntityRelationProperty } from "./entity-relation-property";

export interface EntitySchema {
    getName(): string;
    getSorter(): ((a: Entity, b: Entity) => number) | undefined;
    hasId(): boolean;
    hasCompositeId(): boolean;
    getIdPaths(): readonly Path[];
    getLeadingIdPaths(): readonly Path[];
    getLastIdPath(): Path;
    hasProperty(name: string): boolean;
    hasIdProperty(name: string): boolean;
    isIdProperty(property: EntityProperty): boolean;
    isPrimitive(name: string): boolean;
    getPrimitive(name: string | Path): EntityPrimitiveProperty;
    getPrimitives(): EntityPrimitiveProperty[];
    isRelation(name: string): boolean;
    getRelation(name: string | Path): EntityRelationProperty;
    getRelations(): EntityRelationProperty[];
    getProperty(key: string): EntityProperty;
    getProperties(): EntityProperty[];
    getPropertyRecord(filter?: (property: EntityProperty) => boolean): Record<string, EntityProperty>;
    getComputedProperties(): readonly EntityComputedProperties[];
    getSchemas(): readonly ConcreteEntitySchema[];
    isUnionSchema(): boolean;
    getDiscriminator(): EntityPrimitiveProperty;
}
