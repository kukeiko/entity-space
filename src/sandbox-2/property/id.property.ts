import { PropertyComponent } from "../component/property.component";

export type IdProperty<
    K extends string,
    V extends IdProperty.ValueType,
    F extends PropertyComponent.Flags = never
    >
    = {
        primitive: V;
        type: "id";
        larifari: "foo";
    } & PropertyComponent<K, ReturnType<V>, F>;

export module IdProperty {
    export type ValueType = BooleanConstructor | NumberConstructor | StringConstructor;

    export interface Any extends PropertyComponent.Any {
        primitive: ValueType;
        type: "id";
        larifari: "foo";
    }
}
