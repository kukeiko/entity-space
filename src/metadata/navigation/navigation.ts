import { IEntityType } from "../entity-type";
import { Property } from "../property";

export type NavigationIdentity =
    "ref"
    | "array:ref"
    | "array:child";

export abstract class Navigation extends Property {
    readonly type: NavigationIdentity;
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
