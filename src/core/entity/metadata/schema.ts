import { SchemaIndex } from "./schema-index";
import { SchemaProperty, SchemaPropertyOptionsArgument, SchemaPropertyType } from "./schema-property";

export class Schema {
    constructor(args: { name: string; properties: Record<string, { type: SchemaPropertyType } & SchemaPropertyOptionsArgument>; key?: SchemaIndex; indexes?: SchemaIndex[] }) {
        this.name = args.name;
        const properties: SchemaProperty[] = [];

        for (const propertyKey in args.properties) {
            const propertyArgs = args.properties[propertyKey];
            const property = new SchemaProperty(propertyKey, propertyArgs.type, propertyArgs);
            properties.push(property);
        }

        this.properties = Object.freeze(properties);
        this.key = args.key;
        this.indexes = Object.freeze((args.indexes ?? []).slice());
    }

    readonly name: string;
    readonly properties: readonly SchemaProperty[];
    readonly key?: SchemaIndex;
    readonly indexes: readonly SchemaIndex[];

    getIndex(name: string): SchemaIndex {
        if (this.key !== void 0 && this.key.name === name) {
            return this.key;
        }

        // [todo] i don't want a linear lookup here as it's on the critical path
        const index = this.indexes.find(index => index.name === name);

        if (index === void 0) {
            throw new Error(`index not found: ${name}`);
        }

        return index;
    }

    getProperty(name: string): SchemaProperty {
        const property = this.properties.find(property => property.name === name);

        if (property === void 0) {
            throw new Error(`schema for model ${this.name} does not have a property named ${name}`);
        }

        return property;
    }
}
