import { Component } from "../../component";

export type FlagsDefinition<F extends Component.Modifier>
    = (
        ("p" extends F ? { flags: { p: true; }; } : {})
        & ("c" extends F ? { flags: { c: true; }; } : {})
        & ("n" extends F ? { flags: { n: true; }; } : {})
        & ("u" extends F ? { flags: { u: true; }; } : {})
    );
