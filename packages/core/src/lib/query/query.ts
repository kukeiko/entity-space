import { Criterion } from "@entity-space/criteria";
import { Entity } from "../entity/entity";
import { Expansion } from "../expansion/expansion";
import { ExpansionObject } from "../expansion/expansion-object";
import { IEntitySchema } from "../schema/schema.interface";

// [todo] T is unused
export class Query<
    T extends Entity = Entity,
    C extends Criterion = Criterion,
    E extends ExpansionObject = ExpansionObject
> {
    // [todo] make criteria optional; can be done once we have the "always" criterion
    constructor(entitySchema: IEntitySchema, criteria: C, expansion?: E | Expansion<E>) {
        this.entitySchema = entitySchema;
        this.criteria = criteria;
        this.expansion =
            expansion === void 0
                ? new Expansion<E>({} as E)
                : expansion instanceof Expansion
                ? expansion
                : new Expansion<E>(expansion);
    }

    private readonly entitySchema: IEntitySchema;
    private readonly criteria: C;
    private readonly expansion: Expansion<E>;

    getEntitySchema(): IEntitySchema {
        return this.entitySchema;
    }

    getCriteria(): C {
        return this.criteria;
    }

    getExpansion(): Expansion<E> {
        return this.expansion;
    }

    getExpansionObject(): E {
        return this.expansion.getObject();
    }
}
