import { StaticType } from "./type";
import { LoadableType } from "./misc-types";
import { TypeInstance } from "./instance";
import { CriteriaForType } from "./criteria";

export interface InstanceLoader<T extends StaticType> {
    load(loadable: LoadableType<T>, criteria: CriteriaForType<T>[]): Map<string | number, TypeInstance<LoadableType<T>>>;
}
