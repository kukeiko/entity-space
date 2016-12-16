import { Navigation } from "./navigation";

export class Reference extends Navigation {
    readonly keyName: string;

    constructor(args: Reference.ICtorArgs) {
        super({
            name: args.name,
            otherType: args.otherType
        });

        this.keyName = args.keyName;
    }
}

export module Reference {
    export interface ICtorArgs extends Navigation.ICtorArgs {
        keyName: string;
    }
}
