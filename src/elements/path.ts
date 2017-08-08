import { NavigationBase } from "../metadata";

/**
 * A path is a chain of navigations.
 */
export class Path {
    readonly property: NavigationBase;
    readonly next: Path;

    constructor(args: {
        property: NavigationBase;
        next?: Path;
    }) {
        this.property = args.property;
        this.next = args.next || null;
    }

    toString(): string {
        return this.next == null ? this.property.name : `${this.property.name}/${this.next.toString()}`;
    }

    toDtoString(): string {
        return this.next == null ? this.property.dtoName : `${this.property.dtoName}/${this.next.toDtoString()}`;
    }
}
