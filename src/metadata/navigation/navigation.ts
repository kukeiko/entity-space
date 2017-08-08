import { EntityType } from "../entity.type";
import { getEntityMetadata } from "../entity.decorator";
import { Property } from "../property";
import { EntityMetadata } from "../entity-metadata";

/**
 * A property that points to one (Reference) or many (Children, Collection) related entities.
 */
export abstract class Navigation extends Property {
    readonly virtual: boolean;

    get otherType(): EntityType<any> { return this._otherType(); };
    private _otherType: () => EntityType<any>;

    get otherTypeMetadata(): EntityMetadata<any> {
        return (this._otherTypeMetadata = this._otherTypeMetadata || getEntityMetadata(this.otherType));
    }
    private _otherTypeMetadata: EntityMetadata<any> = null;

    constructor(args: Navigation.CtorArgs) {
        super(args);

        this._otherType = args.other;
        this.virtual = !!args.virtual;
    }
}

export module Navigation {
    export interface CtorArgs extends Property.CtorArgs {
        other: () => EntityType<any>;
        virtual?: boolean;
    }
}
