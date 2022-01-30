import { Criterion } from "@entity-space/criteria";
import { Entity } from "../entity/entity";
import { Expansion } from "../expansion/expansion";
import { IEntitySchema } from "../schema/schema.interface";

// [todo] T is unused
export class Query<T extends Entity = Entity, C extends Criterion = Criterion, E extends Expansion = Expansion> {
    // [todo] make criteria optional; can be done once we have the "always" criterion
    constructor(entitySchema: IEntitySchema, criteria: C, expansion?: E) {
        this.entitySchema = entitySchema;
        this.criteria = criteria;
        this.expansion = expansion ?? {} as E;
    }

    private readonly entitySchema: IEntitySchema;
    private readonly criteria: C;
    private readonly expansion: E;

    getEntitySchema(): IEntitySchema {
        return this.entitySchema;
    }

    getCriteria(): C {
        return this.criteria;
    }

    getExpansion(): E {
        return this.expansion;
    }
}
