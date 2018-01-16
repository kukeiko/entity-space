import { PropertyBase } from "../property-base";

export abstract class LocalBase extends PropertyBase {
    // we have to explicitly state the type, otherwise its missing @ .d.ts
    readonly base: "local" = "local";
    readonly computed: boolean;
    readonly saveable: boolean;

    constructor(name: string, args: LocalBase.CtorArgs) {
        super(name, args);
        this.computed = !!args.computed;
        this.saveable = args.saveable || false;
    }
}

export module LocalBase {
    export interface CtorArgs extends PropertyBase.CtorArgs {
        computed?: boolean;
        saveable?: boolean;
    }
}
