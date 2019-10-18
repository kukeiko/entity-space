import { EntityType } from "../type";
import { PropertyComponent } from "../component/property.component";
import { Instance } from "../instance";

export type ReferenceProperty<
    K extends string,
    // V extends EntityType,
    V ,
    F extends Exclude<PropertyComponent.Flags, "u"> = never
    > = {
        type: "reference";
        referenced: () => V;
    }
    & PropertyComponent<K, Instance<V>, F>;

export module ReferenceProperty {
    export type Any
        = {
            type: "reference";
            referenced: () => EntityType;
        }
        & PropertyComponent.Any;
}
