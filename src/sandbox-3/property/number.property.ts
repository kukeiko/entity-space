import { PropertyComponent } from "../component/property.component";

export type NumberProperty<
    K extends string,
    F extends PropertyComponent.Flags = never
    >
    = {
        primitive: typeof Number;
        type: "number";
    } & PropertyComponent<K, ReturnType<typeof Number>, F>;

export module NumberProperty {
    export type Any
        = {
            primitive: typeof Number;
            type: "number";
        }
        & PropertyComponent.Any;
}
