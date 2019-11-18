export type Context
    = "creatable"
    | "loadable"
    | "patchable";

/**
 * [todo] naming sucks
 */
export interface StateValue<O extends boolean = false, N extends boolean = false, V extends boolean = false> {
    /**
     * If the property has to exist when in this state (support for OData $select on primitives).
     */
    omittable: O;

    /**
     * If the value of a property in this state can be set to null.
     */
    nullable: N;

    /**
     * If the value of a property in this state can be set to undefined.
     */
    voidable: V;
}

export type WithContext<C extends Context, O extends boolean = false, N extends boolean = false, V extends boolean = false> = Record<C, StateValue<O, N, V>>;

export type WidenValueForContext<P, C extends Context, V>
    = (
        P extends WithContext<C, any, true, true> ? V | null | undefined
        : P extends WithContext<C, any, true, false> ? V | null
        : P extends WithContext<C, any, false, true> ? V | undefined
        : V
    );
