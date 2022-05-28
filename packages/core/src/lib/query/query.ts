import { any, Criterion } from "@entity-space/criteria";
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
    constructor(entitySchema: IEntitySchema, criteria: C = any() as C, expansion?: E | Expansion<E>) {
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

    toString(): string {
        return `${this.entitySchema.getId()}/${this.criteria}/${JSON.stringify(this.expansion.getObject())}`;
    }
}
