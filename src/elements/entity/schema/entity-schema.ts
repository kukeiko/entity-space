import { Path } from "@entity-space/utils";
import { Entity } from "../entity";
import { EntityPrimitiveProperty } from "../entity-primitive-property";
import { EntityProperty } from "../entity-property";
import { EntityRelationProperty } from "../entity-relation-property";
import { EntityComputedProperties } from "./entity-computed-properties";

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
    isRelation(name: string): boolean;
    getRelation(name: string | Path): EntityRelationProperty;
    getRelations(): EntityRelationProperty[];
    getProperty(key: string): EntityProperty;
    getProperties(): EntityProperty[];
    getPrimitiveProperties(): EntityPrimitiveProperty[];
    getPropertyRecord(filter?: (property: EntityProperty) => boolean): Record<string, EntityProperty>;
    getComputedProperties(): readonly EntityComputedProperties[];
}
