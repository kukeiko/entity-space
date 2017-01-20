import { IEntityType } from "./entity-type";
import { Navigation } from "./navigation";
import { ValueType } from "./value-type";

export class Reference extends Navigation {
    readonly keyName: string;

    constructor(args: Reference.ICtorArgs) {
        super({
            alias: args.alias,
            virtual: args.virtual,
            name: args.name,
            other: args.other,
            saveable: args.saveable,
            valueType: ValueType.Object
        });

        this.keyName = args.key;
    }
}

export module Reference {
    export interface ICtorArgs {
        alias?: string;
        key: string;
        name: string;
        other: () => IEntityType<any>;
        saveable?: boolean;
        virtual?: boolean;
    }
}
