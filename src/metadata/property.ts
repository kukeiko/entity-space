export class Property {
    readonly name: string;

    constructor(args: {
        name: string;
    }) {
        this.name = args.name;
    }
}
