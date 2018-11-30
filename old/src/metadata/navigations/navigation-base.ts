import { EntityType } from "../entity.type";
import { PropertyBase } from "../property-base";
import { ClassMetadata, getMetadata } from "../class-metadata";

/**
 * A property that points to one (Reference) or many (Children, Collection) related entities.
 */
// todo: figure out if we can prevent exporting it from index.ts
export abstract class NavigationBase extends PropertyBase {
    // we have to explicitly state the type, otherwise its missing @ .d.ts
    readonly family: "navigation" = "navigation";
    readonly virtual: boolean;

    get otherType(): EntityType<any> { return this._otherType(); };
    private _otherType: () => EntityType<any>;

    get otherTypeMetadata(): ClassMetadata<any> {
        return (this._otherTypeMetadata = this._otherTypeMetadata || getMetadata(this.otherType));
    }
    private _otherTypeMetadata: ClassMetadata<any> = null;

    constructor(name: string, args: NavigationBase.CtorArgs) {
        super(name, args);

        this._otherType = args.other;
        this.virtual = !!args.virtual;
    }
}

export module NavigationBase {
    export interface CtorArgs extends PropertyBase.CtorArgs {
        other: () => EntityType<any>;
        virtual?: boolean;
    }
}
