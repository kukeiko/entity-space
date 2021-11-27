import { Criterion } from "../criteria/criterion";
import { Expansion } from "../expansion/expansion";

export interface Query {
    criteria: Criterion;
    expansion: Expansion;
}
