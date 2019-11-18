import { Type } from "./type";
import { Instance } from "./instance";
import { CriteriaForType } from "./criteria";
import { PartialType } from "./property";

export interface InstanceLoader<T extends Type> {
    load(loadable: PartialType<T>, criteria: CriteriaForType<T>[]): Map<string | number, Instance<PartialType<T>, "loadable">>;
}
