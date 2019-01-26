import { Property } from "./property";

// [todo] the name "Type" is so generic, maybe there is a better option?
// we could go back to EntityType, but i'd love a single word.
// "Schema" and "Blueprint" is what i have come up with so far
// [todo] check if defaulting K to string (Type<K extends string = string>) would break anything
export interface Type<K extends string> {
    $: Type.Metadata<K>;
    // [k: string]: Property<any, any>;
}

export module Type {
    export interface Metadata<K extends string> {
        name: K;
    }

    export type NameOf<T extends Type<K>, K extends string = string> = T["$"]["name"];

    export function createKeys<T extends Type<any>>(map: { [P in Property.Keys<T>]: P }): Property.Keys<T>[] {
        let keys: Property.Keys<T>[] = [];

        return keys;
    }
}
