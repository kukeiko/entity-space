import { IEntityType } from "./entity-type";
import { Property } from "./property";

export class Navigation extends Property {
    get otherType(): IEntityType { return this._otherType(); };
    private _otherType: () => IEntityType;

    get virtual(): boolean { return this._virtual; }
    private _virtual: boolean;

    constructor(args: Navigation.ICtorArgs) {
        super(args);

        this._otherType = args.other;
        this._virtual = !!args.virtual;
    }
}

export module Navigation {
    export interface ICtorArgs extends Property.ICtorArgs {
        other: () => IEntityType;
        virtual?: boolean;
    }
}
