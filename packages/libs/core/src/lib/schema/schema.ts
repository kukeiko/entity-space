import { EntitySpaceSchemaRelation_Old } from "./entity-space-schema";
import { OpenApiDiscriminator } from "./open-api-schema";
import { SchemaIndexV1 } from "./schema-v1-index";

export interface Schema {
    getAllIndexes(): readonly SchemaIndexV1[];
    getAllOf(): Schema[];
    getDiscriminators(): OpenApiDiscriminator[];
    getIndex(name: string): SchemaIndexV1;
    getIndexes(): readonly SchemaIndexV1[];
    getKeyIndex(): SchemaIndexV1;
    getNominalSchemaId(): string;
    getNominalSchema(): Schema;
    getProperties(): readonly SchemaProperty[];
    getProperty(name: string): SchemaProperty;
    getPropertyByPath(path: string): SchemaProperty;
    getRelations(): EntitySpaceSchemaRelation_Old[];
    getSchemaId(): string;
    getSchemaName(): string;
    getType(): string;
    getUnionDiscriminator(): OpenApiDiscriminator | undefined;
    hasKey(): boolean;
    isUnion(): boolean;
}

export interface SchemaProperty extends Schema {
    getPropertyName(): string;
    isNavigable(): boolean;
}
