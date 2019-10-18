import { StringProperty, ReferenceProperty } from "./property";

export * from "./property";

export type Property
    = StringProperty<any, any>
    | ReferenceProperty<any, any, any>;
    
