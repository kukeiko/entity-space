import { LocalBase } from "./local-base";

export class Instance extends LocalBase {
    readonly type = "instance";
    readonly cloneMethod: Instance.CloneMethod;
    readonly compareMethod: Instance.CompareMethod;

    constructor(name: string, args: Instance.CtorArgs) {
        super(name, args);

        this.cloneMethod = args.clone != null ? args.clone : "clone";
        this.compareMethod = args.compare != null ? args.compare : "equals";
    }
}

export module Instance {
    export interface CtorArgs extends LocalBase.CtorArgs {
        clone?: CloneMethod;
        compare?: CompareMethod;
    }

    export type CloneMethod =
        "clone"
        | "copy-constructor";

    export type CompareMethod =
        "equals"
        | "equals-ordered";
}
