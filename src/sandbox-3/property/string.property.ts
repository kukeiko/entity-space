import { PropertyComponent } from "../component/property.component";

export type StringProperty<
    K extends string,
    F extends PropertyComponent.Flags = never
    >
    = {
        primitive: typeof String;
        type: "string";
    } & PropertyComponent<K, ReturnType<typeof String>, F>;

export module StringProperty {
    export type Any
        = {
            primitive: typeof String;
            type: "string";
        }
        & PropertyComponent.Any;
}
