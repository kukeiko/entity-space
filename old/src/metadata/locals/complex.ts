import { LocalBase } from "./local-base";

export class Complex extends LocalBase {
    // we have to explicitly state the type, otherwise its missing @ .d.ts
    readonly type: "complex" = "complex";
    readonly compareMethod: Complex.CompareMethod;

    constructor(name: string, args: Complex.CtorArgs) {
        super(name, args);

        this.compareMethod = args.compare != null ? args.compare : "equals";
    }
}

export module Complex {
    export interface CtorArgs extends LocalBase.CtorArgs {
        compare?: CompareMethod;
    }

    export type CompareMethod =
        "equals"
        | "equals-ordered";
}
