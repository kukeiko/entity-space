import { PropertyComponent } from "../component/property.component";

/**
 * [todo] figure out why 'F extends never ? "u" : "c" | "u"' doesn't work.
 */
export type IdProperty<
    K extends string,
    V extends IdProperty.ValueType,
    F extends "c" = never
    >
    = {
        primitive: V;
        type: "id";
        larifari: "foo";
    } & PropertyComponent<K, ReturnType<V>, "c" extends F ? "c" | "u" : "u">;

export module IdProperty {
    export type ValueType = BooleanConstructor | NumberConstructor | StringConstructor;

    export interface Any extends PropertyComponent.Any {
        primitive: ValueType;
        type: "id";
        larifari: "foo";
    }
}
