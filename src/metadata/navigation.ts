import { IEntityType } from "./entity-type";
import { Property } from "./property";

export class Navigation extends Property {
    get otherType(): IEntityType<any> { return this._otherType(); };
    private _otherType: () => IEntityType<any>;

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
        other: () => IEntityType<any>;
        virtual?: boolean;
    }
}
