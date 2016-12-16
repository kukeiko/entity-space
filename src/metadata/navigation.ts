import { IEntityType } from "./entity-decorator";
import { Property } from "./property";

export class Navigation extends Property {
    private _otherType: () => IEntityType;
    get otherType(): IEntityType { return this._otherType(); };

    constructor(args: Navigation.ICtorArgs) {
        super({ name: args.name });

        this._otherType = args.otherType;
    }
}

export module Navigation {
    export interface ICtorArgs extends Property.ICtorArgs {
        otherType: () => IEntityType;
    }
}
