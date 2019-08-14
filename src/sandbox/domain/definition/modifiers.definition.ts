import { Component } from "../../component";

export type ModifiersDefinition<X> = X extends Component.Property<infer K, infer V, infer M>
    ? (
        ("p" extends M ? { flags: { p: true; }; } : {})
        & ("c" extends M ? { flags: { c: true; }; } : {})
        & ("n" extends M ? { flags: { n: true; }; } : {})
        & ("u" extends M ? X extends Component.Id ? {} : { flags: { u: true; }; } : {})
    ) : {};


