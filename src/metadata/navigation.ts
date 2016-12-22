import { IEntityType } from "./entity-type";
import { Property } from "./property";

export class Navigation extends Property {
    private _otherType: () => IEntityType;
    get otherType(): IEntityType { return this._otherType(); };

    constructor(args: Navigation.ICtorArgs) {
        super(args);

        this._otherType = args.other;
    }
}

export module Navigation {
    export interface ICtorArgs extends Property.ICtorArgs {
        other: () => IEntityType;
    }
}
