import { Navigation } from "../metadata";

/**
 * A path is a chain of navigations.
 */
export class Path {
    readonly property: Navigation;
    readonly next: Path;

    constructor(args: {
        property: Navigation;
        next?: Path;
    }) {
        this.property = args.property;
        this.next = args.next || null;
    }

    toString(): string {
        return this.next == null ? this.property.name : `${this.property.name}/${this.next.toString()}`;
    }

    toAliasedString(): string {
        return this.next == null ? this.property.alias : `${this.property.alias}/${this.next.toAliasedString()}`;
    }
}
