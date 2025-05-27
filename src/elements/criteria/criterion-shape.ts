import { Class } from "@entity-space/utils";
import { Criterion } from "./criterion";

export abstract class CriterionShape<T extends Criterion = Criterion> {
    abstract readonly type: string;
    abstract getCriterionType(): Class<T>;
    abstract toString(): string;
}
