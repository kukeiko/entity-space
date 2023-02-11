import { hasProperty } from "@entity-space/utils";
import { Entity } from "../common/entity.type";
import { IEntityQuery } from "./entity-query.interface";

export class EntityQueryError<T extends Entity = Entity> {
    constructor(query: IEntityQuery, public error: unknown) {}

    getErrorMessage(): string {
        if (hasProperty(this.error, "message")) {
            if (typeof this.error.message === "string") {
                return this.error.message;
            } else {
                return JSON.stringify(this.error.message);
            }
        }

        return JSON.stringify(this.error);
    }
}
