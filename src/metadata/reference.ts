import { IEntityType } from "./entity-decorator";
import { Navigation } from "./navigation";

export class Reference extends Navigation {
    private _keyName: string;
    get keyName(): string { return this._keyName };

    constructor(args: Reference.ICtorArgs) {
        super({
            name: args.name,
            otherType: args.otherType
        });

        this._keyName = args.keyName;
    }
}

export module Reference {
    export interface ICtorArgs {
        keyName: string;
        name: string;
        otherType: () => IEntityType;
    }
}
