import { Criterion } from "@entity-space/criteria";
import { Expansion } from "../expansion/expansion";
import { IEntitySchema } from "../schema/public";

export interface Query {
    entitySchema: IEntitySchema;
    criteria: Criterion;
    expansion: Expansion;
}
