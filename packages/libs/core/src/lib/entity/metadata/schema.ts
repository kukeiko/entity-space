import { EntitySpaceSchemaRelation, OpenApiDiscriminator } from "./schema-json";
import { SchemaIndexV1 } from "./schema-v1-index";

export interface Schema {
    getAllOf(): Schema[];
    getDiscriminators(): OpenApiDiscriminator[];
    getIndex(name: string): SchemaIndexV1;
    getAllIndexes(): readonly SchemaIndexV1[];
    getIndexes(): readonly SchemaIndexV1[];
    getProperties(): readonly SchemaProperty[];
    getRelations(): EntitySpaceSchemaRelation[];
    getSchemaName(): string;
    getType(): string;
    getUnionDiscriminator(): OpenApiDiscriminator | undefined;
    isUnion(): boolean;
    hasKey(): boolean;
    getKeyIndex(): SchemaIndexV1;
}

export interface SchemaProperty {
    getPropertyName(): string;
}
