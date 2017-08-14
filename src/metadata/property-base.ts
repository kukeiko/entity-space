export abstract class PropertyBase {
    readonly dtoName: string;
    readonly name: string;

    constructor(name: string, args: PropertyBase.CtorArgs) {
        this.name = name;
        this.dtoName = args.dtoName || name;
    }

    getName(dto?: boolean): string {
        return dto ? this.dtoName : this.name;
    }
}

export module PropertyBase {
    export interface CtorArgs {
        dtoName?: string;
    }
}
