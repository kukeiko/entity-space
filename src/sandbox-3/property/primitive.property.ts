import { PropertyComponent } from "../component/property.component";

export type PrimitiveProperty<
    K extends string,
    V extends PrimitiveProperty.ValueType,
    F extends PropertyComponent.Flags = never
    >
    = {
        primitive: V;
        type: "primitive";
    } & PropertyComponent<K, ReturnType<V>, F>;

export module PrimitiveProperty {
    export type ValueType = BooleanConstructor | NumberConstructor | StringConstructor;

    export interface Any extends PropertyComponent.Any {
        primitive: ValueType;
        type: "primitive";
    }
}
