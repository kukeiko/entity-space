import { StaticType } from "./type";
import { SelectedType } from "./type-selector";
import { InstanceOf } from "./instance";
import { Criteria } from "./criteria";

export interface InstanceLoader<T extends StaticType> {
    load(selected: SelectedType<T>, criteria: Criteria[]): Map<string | number, InstanceOf<SelectedType<T>>>;
}
