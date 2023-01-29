import { EntitySchema } from "@entity-space/core";

export class CommonModelSchemaCatalog {
    constructor() {
        this.userSchema = new EntitySchema("user");
        this.userSchema.setKey("id");
    }

    private readonly userSchema: EntitySchema;

    getUserSchema(): EntitySchema {
        return this.userSchema;
    }
}
