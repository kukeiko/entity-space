import { Schema } from "./schema";
import { EntitySpaceSchemaRelation, OpenApiDiscriminator } from "./schema-json";
import { SchemaIndexV1, SchemaIndexOptionsArgumentV1 } from "./schema-v1-index";
import { SchemaPropertyV1, SchemaPropertyOptionsArgumentV1, SchemaPropertyTypeV1 } from "./schema-v1-property";

export type SchemaPropertiesArgument = Record<string, { type: SchemaPropertyTypeV1 } & SchemaPropertyOptionsArgumentV1>;
export type SchemaKeyArgument = string | string[] | { name: string; path: string | string[] };

// [todo] so just because you want to set an index to unique, you suddenly are forced to use the object declaration
// (instead of either just a string or string[]). consider allowing "[...string[], boolean]" as a valid type of argument,
// where the boolean is the "unique" flag. i do think it makes sense to keep the SchemaIndexOptions - reason i'm even
// mentioning this is because, as of writing this, there is only the "unique" flag in there.
export type SchemaIndexArgumentV1 =
    | string
    | string[]
    | ({ name?: string; path: string | string[] } & SchemaIndexOptionsArgumentV1);

function buildDefaultIndexName(path: string[]): string {
    return path.join(",");
}

export type SchemaWithKeyV1 = SchemaV1 & Required<Pick<SchemaV1, "key">>;

export class SchemaV1 implements Schema {
    constructor(args: {
        name: string;
        properties: SchemaPropertiesArgument;
        key?: SchemaKeyArgument;
        indexes?: SchemaIndexArgumentV1[];
    }) {
        this.name = args.name;
        const properties: SchemaPropertyV1[] = [];

        for (const key in args.properties) {
            properties.push(new SchemaPropertyV1(key, args.properties[key].type, args.properties[key]));
        }

        this.properties = Object.freeze(properties);

        if (args.key !== void 0) {
            if (typeof args.key === "string") {
                this.key = new SchemaIndexV1(args.key, [args.key], { unique: true });
            } else if (Array.isArray(args.key)) {
                this.key = new SchemaIndexV1(buildDefaultIndexName(args.key), args.key, { unique: true });
            } else {
                this.key = new SchemaIndexV1(args.key.name, args.key.path, { unique: true });
            }
        }

        const indexes: SchemaIndexV1[] = [];

        if (args.indexes !== void 0) {
            for (const indexArgs of args.indexes) {
                let index: SchemaIndexV1;

                if (typeof indexArgs === "string") {
                    index = new SchemaIndexV1(indexArgs, [indexArgs]);
                } else if (Array.isArray(indexArgs)) {
                    index = new SchemaIndexV1(buildDefaultIndexName(indexArgs), indexArgs);
                } else {
                    let name = indexArgs.name;

                    if (name === void 0) {
                        if (typeof indexArgs.path === "string") {
                            name = indexArgs.path;
                        } else {
                            name = buildDefaultIndexName(indexArgs.path);
                        }
                    }

                    index = new SchemaIndexV1(name, indexArgs.path, indexArgs);
                }

                indexes.push(index);
            }
        }

        if (this.key !== void 0) {
            indexes.push(this.key);
        }

        this.indexes = Object.freeze(indexes.slice());
    }

    readonly name: string;
    readonly properties: readonly SchemaPropertyV1[];
    readonly key?: SchemaIndexV1;
    readonly indexes: readonly SchemaIndexV1[];

    getKeyIndex(): SchemaIndexV1 {
        if (this.key === void 0) {
            throw new Error(`no key defined on schema ${this.name}`);
        }

        return this.key;
    }

    getSchemaName(): string {
        return this.name;
    }

    getAllOf(): Schema[] {
        return [];
    }

    getType(): string {
        return "object";
    }

    isUnion(): boolean {
        return false;
    }

    getUnionDiscriminator(): OpenApiDiscriminator | undefined {
        return void 0;
    }

    getDiscriminators(): OpenApiDiscriminator[] {
        return [];
    }

    getRelations(): EntitySpaceSchemaRelation[] {
        return [];
    }

    getIndex(name: string): SchemaIndexV1 {
        // [todo] i don't want a linear lookup here as it's on the critical path
        const index = this.indexes.find(index => index.name === name);

        if (index === void 0) {
            throw new Error(`index ${name} not found on schema ${this.name}`);
        }

        return index;
    }

    getAllIndexes(): readonly SchemaIndexV1[] {
        return this.indexes;
    }

    getIndexes(): readonly SchemaIndexV1[] {
        return this.indexes.filter(index => index.name !== this.key?.name);
    }

    getProperty(name: string): SchemaPropertyV1 {
        const property = this.properties.find(property => property.name === name);

        if (property === void 0) {
            throw new Error(`schema for model ${this.name} does not have a property named ${name}`);
        }

        return property;
    }

    getProperties(): readonly SchemaPropertyV1[] {
        return this.properties;
    }

    hasKey(): this is SchemaWithKeyV1 {
        return SchemaV1.hasKey(this);
    }

    static hasKey(schema: SchemaV1): schema is SchemaWithKeyV1 {
        return schema.key !== void 0;
    }
}
