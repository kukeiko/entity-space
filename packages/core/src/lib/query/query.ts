import { Criterion } from "../criteria/criterion";
import { Expansion } from "../expansion/expansion";

export interface Query {
    model: string;
    criteria: Criterion;
    expansion: Expansion;
}
