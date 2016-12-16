import { Navigation } from "./metadata";

/**
 * A path is a chain of navigation properties.
 */
export class Path {
    private _property: Navigation;
    get property(): Navigation { return this._property };

    private _next: Path;
    get next(): Path { return this._next };

    constructor(args: {
        property: Navigation;
        next?: Path;
    }) {
        this._property = args.property;
        this._next = args.next || null;
    }

    toString(): string {
        return this.next == null ? this.property.name : `${this.property.name}/${this.next.toString()}`;
    }
}
