import { Class } from "@entity-space/utils";
import { EntitySchemaBuilder } from "./entity-schema-builder";
import { ConcreteEntitySchema } from "./schema/concrete-entity-schema";
import { EntitySchema } from "./schema/entity-schema";

export class EntitySchemaCatalog {
    #isBuilt = false;
    #schemas = new Map<Class | Class[], ConcreteEntitySchema>();
    #schemasByName = new Map<string, ConcreteEntitySchema>();

    getSchema(name: string): EntitySchema {
        this.#build();
        const schema = this.#schemasByName.get(name);

        if (!schema) {
            throw new Error(`schema ${name} doesn't exist`);
        }

        return schema;
    }

    getSchemas(): readonly EntitySchema[] {
        this.#build();
        return Array.from(this.#schemas.values());
    }

    getSchemaByBlueprint(blueprint: Class | Class[]): EntitySchema {
        this.#build();
        const schema = this.#schemas.get(blueprint);

        if (!schema) {
            throw new Error("schema not found");
        }

        return schema;
    }

    #build(): void {
        if (this.#isBuilt) {
            return;
        }

        const builder = new EntitySchemaBuilder();
        builder.addFromRegisteredBlueprints();
        const schemas = builder.build();
        this.#schemas = new Map(schemas.entries());
        this.#schemasByName = new Map(Array.from(schemas.values()).map(schema => [schema.getName(), schema]));
        this.#isBuilt = true;
    }
}
