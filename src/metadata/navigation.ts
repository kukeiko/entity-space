import { IEntityType } from "./entity-type";
import { Property } from "./property";

export class Navigation extends Property {
    readonly virtual: boolean;

    get otherType(): IEntityType<any> { return this._otherType(); };
    private _otherType: () => IEntityType<any>;

    constructor(args: Navigation.ICtorArgs) {
        super(args);

        this._otherType = args.other;
        this.virtual = !!args.virtual;
    }
}

export module Navigation {
    export interface ICtorArgs extends Property.ICtorArgs {
        other: () => IEntityType<any>;
        virtual?: boolean;
    }
}
