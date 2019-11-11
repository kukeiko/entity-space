import { Property } from "./property";

export type State
    = "creatable"
    | "default"
    | "loadable"
    | "patchable";

// export type WithState<S extends State> = Record<S, true | { nullable: boolean; voidable: boolean; }>;
export type WithState<S extends State, N extends boolean = false, V extends boolean = false> = Record<S, { nullable: N; voidable: V; }>;

type X = boolean extends true ? true : false;

export type WidenValueForState<P, S extends State, V>
    = (
        P extends WithState<S, true, true> ? V | null | undefined
        : P extends WithState<S, true, false> ? V | null
        : P extends WithState<S, false, true> ? V | undefined
        : V
    );

// ? (P["creatable"]["nullable"] extends true ? V | null : V) & (P["creatable"]["voidable"] extends true ? V | null : V)
// ?(true extends P["creatable"]["nullable"] ? V | null : V)

let creatable: WithState<"creatable", true, true> = {
    creatable: {
        nullable: true,
        voidable: true
    }
};

type widened = WidenValueForState<WithState<"creatable", true, true> & WithState<"loadable", true, false>, "loadable", string>;
