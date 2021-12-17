import { SchemaIndex, SchemaIndexOptionsArgument } from "./schema-index";
import { SchemaProperty, SchemaPropertyOptionsArgument, SchemaPropertyType } from "./schema-property";

export type SchemaPropertiesArgument = Record<string, { type: SchemaPropertyType } & SchemaPropertyOptionsArgument>;
export type SchemaKeyArgument = string | string[] | { name: string; path: string | string[] };
// [todo] so just because you want to set an index to unique, you suddenly are forced to use the object declaration
// (instead of either just a string or string[]). consider allowing "[...string[], boolean]" as a valid type of argument,
// where the boolean is the "unique" flag. i do think it makes sense to keep the SchemaIndexOptions - reason i'm even
// mentioning this is because, as of writing this, there is only the "unique" flag in there.
export type SchemaIndexArgument = string | string[] | ({ name?: string; path: string | string[] } & SchemaIndexOptionsArgument);

function buildDefaultIndexName(path: string[]): string {
    return path.join(",");
}

export type SchemaWithKey = Schema & Required<Pick<Schema, "key">>;

export class Schema {
    constructor(args: { name: string; properties: SchemaPropertiesArgument; key?: SchemaKeyArgument; indexes?: SchemaIndexArgument[] }) {
        this.name = args.name;
        const properties: SchemaProperty[] = [];

        for (const key in args.properties) {
            properties.push(new SchemaProperty(key, args.properties[key].type, args.properties[key]));
        }

        this.properties = Object.freeze(properties);

        if (args.key !== void 0) {
            if (typeof args.key === "string") {
                this.key = new SchemaIndex(args.key, [args.key], { unique: true });
            } else if (Array.isArray(args.key)) {
                this.key = new SchemaIndex(buildDefaultIndexName(args.key), args.key, { unique: true });
            } else {
                this.key = new SchemaIndex(args.key.name, args.key.path, { unique: true });
            }
        }

        const indexes: SchemaIndex[] = [];

        if (args.indexes !== void 0) {
            for (const indexArgs of args.indexes) {
                let index: SchemaIndex;

                if (typeof indexArgs === "string") {
                    index = new SchemaIndex(indexArgs, [indexArgs]);
                } else if (Array.isArray(indexArgs)) {
                    index = new SchemaIndex(buildDefaultIndexName(indexArgs), indexArgs);
                } else {
                    let name = indexArgs.name;

                    if (name === void 0) {
                        if (typeof indexArgs.path === "string") {
                            name = indexArgs.path;
                        } else {
                            name = buildDefaultIndexName(indexArgs.path);
                        }
                    }

                    index = new SchemaIndex(name, indexArgs.path, indexArgs);
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
    readonly properties: readonly SchemaProperty[];
    readonly key?: SchemaIndex;
    readonly indexes: readonly SchemaIndex[];

    getIndex(name: string): SchemaIndex {
        // [todo] i don't want a linear lookup here as it's on the critical path
        const index = this.indexes.find(index => index.name === name);

        if (index === void 0) {
            throw new Error(`index ${name} not found on schema ${this.name}`);
        }

        return index;
    }

    getIndexes(): readonly SchemaIndex[] {
        return this.indexes;
    }

    getProperty(name: string): SchemaProperty {
        const property = this.properties.find(property => property.name === name);

        if (property === void 0) {
            throw new Error(`schema for model ${this.name} does not have a property named ${name}`);
        }

        return property;
    }

    getProperties(): readonly SchemaProperty[] {
        return this.properties;
    }

    hasKey(): this is SchemaWithKey {
        return this.key !== void 0;
    }
}
