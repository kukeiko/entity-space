import { getEntityMetadata, EntityType, Navigation } from "../metadata";
import { Path } from "./path";
import { Extraction } from "./extraction";

/**
 * An expansion defines which navigations should be considered for execution
 * by representing them in a tree-like structure.
 *
 * * Create one by using Expansion.parse()
 * * Compare expansions via equals(), isSupersetOf(), isSubsetOf()
 * * Create modified versions via add(), minus(), extract()
 *
 * Immutable
 */
export class Expansion {
    /**
     * The navigation that is being expanded.
     */
    readonly property: Navigation;

    /**
     * Further expansions on the navigation.
     */
    readonly expansions: ReadonlyArray<Expansion>;

    /**
     * Number of all expansions (including nested).
     */
    readonly numExpansions: number;

    /**
     * Is lazily evaluated @ toString()
     */
    private _toStringValue: string;

    private constructor(args: {
        property: Navigation;
        expansions?: Expansion[];
    }) {
        this.property = args.property;
        this.expansions = Object.freeze((args.expansions || []).slice().sort((a, b) => a.property.name < b.property.name ? -1 : 1));
        this.numExpansions = this.expansions.length + this.expansions.map(exp => exp.numExpansions).reduce((p, c) => p + c, 0);
    }

    /**
     * Equality comparison between two queries by checking equality of their string representations.
     */
    static equals(a: Expansion, b: Expansion): boolean {
        return a.toString() == b.toString();
    }

    /**
     * Determines if x is a superset of y, securing that an operation using expansion(s) x
     * leads to a superset of y if the same operation were to be used with expansion(s) y.
     */
    static isSuperset(x: Expansion, y: Expansion): boolean;
    static isSuperset(x: Expansion[], y: Expansion[]): boolean;
    static isSuperset(...args: any[]): boolean {
        let x = args[0] as Expansion | Expansion[];
        let y = args[1] as Expansion | Expansion[];

        if (x instanceof Array && y instanceof Array) {
            // x can not be a superset if y contains more expansions
            if (x.length < y.length) return false;

            x = x.slice().sort((a, b) => a.property.name < b.property.name ? -1 : 1);
            y = y.slice().sort((a, b) => a.property.name < b.property.name ? -1 : 1);

            let e = 0;

            for (let i = 0; i < x.length; ++i) {
                let [xExp, yExp] = [x[i], y[e]];

                // if we reached the end of y, x must be a superset
                if (yExp == null) break;

                if (xExp.property != yExp.property) {
                    if (x.length > y.length) {
                        // property of x does not exist in y, x is still a superset - advance x
                        continue;
                    } else {
                        // y has a property that is not in x, x can not be a superset
                        return false;
                    }
                }

                // properties of x and y match - recurse onto nested expansion
                if (!Expansion.isSuperset(xExp, yExp)) return false;

                e++;
            }

            return true;
        } else if (x instanceof Expansion && y instanceof Expansion) {
            // x can't be a superset if y points to a different property
            if (x.property != y.property) return false;
            // x can't be a superset if y has more expansions
            if (x.expansions.length < y.expansions.length) return false;

            // x and y match in property and expansion length - deepen recursion
            return Expansion.isSuperset(x.expansions.slice(), y.expansions.slice());
        } else {
            throw new Error("invalid arguments");
        }
    }

    /**
     * Merges two expansions together.
     */
    // todo: throw if expansions are not of same entity type
    static add(x: Expansion[], y: Expansion[]): Expansion[] {
        x = x.slice().sort((a, b) => a.property.name < b.property.name ? -1 : 1);
        y = y.slice().sort((a, b) => a.property.name < b.property.name ? -1 : 1);

        let merged: Expansion[] = [];
        let xi = 0;
        let yi = 0;

        while (true) {
            // handle reaching end of either both, just x or just y
            if (x[xi] == null && y[yi] == null) {
                break;
            } else if (x[xi] == null) {
                merged = [...merged, ...y.slice(yi)];
                break;
            } else if (y[yi] == null) {
                merged = [...merged, ...x.slice(xi)];
                break;
            }

            // handle merging based on property arrangement
            if (x[xi].property == y[yi].property) {
                // properties of x and y match - recurse onto nested expansion
                merged = [...merged, new Expansion({
                    property: x[xi].property,
                    expansions: Expansion.add(x[xi].expansions.slice(), y[yi].expansions.slice())
                })];

                xi++;
                yi++;
            } else if (x[xi].property.name < y[yi].property.name) {
                // property of x is not in y, simply add
                merged = [...merged, x[xi]];
                xi++;
            } else {
                // property of y is not in x, simply add
                merged = [...merged, y[yi]];
                yi++;
            }
        }

        return merged;
    }

    /**
     * Subtracts y from x.
     */
    // todo: throw if expansions are not of same entity type
    static minus(x: Expansion[], y: Expansion[]): Expansion[] {
        if (x.length == 0 || y.length == 0) return x;

        let result: Expansion[] = [];
        let xi = 0;
        let yi = 0;

        x = x.slice().sort((a, b) => a.property.name < b.property.name ? -1 : 1);
        y = y.slice().sort((a, b) => a.property.name < b.property.name ? -1 : 1);

        while (true) {
            if (x[xi] == null) {
                break;
            } else if (y[yi] == null) {
                result = [...result, ...x.slice(xi)];
                break;
            } else if (x[xi].property == y[yi].property) {
                let remaining = Expansion.minus(x[xi].expansions.slice(), y[yi].expansions.slice());

                if (remaining.length > 0) {
                    result = [...result, new Expansion({
                        property: x[xi].property,
                        expansions: remaining
                    })];
                }

                xi++;
                yi++;
            } else if (x[xi].property.name < y[yi].property.name) {
                result.push(x[xi]);
                xi++;
            } else {
                yi++;
            }
        }

        return result;
    }

    /**
     * Create expansions starting at ownerType, crawling down
     * navigations as defined in the expansion string.
     *
     * Expansion string may contain spaces and newlines.
     *
     * Example: Expansion.parse(artistMetadata, "albums/{songs,tags}")
     */
    static parse(ownerType: EntityType<any>, expansion: string): Expansion[] {
        expansion = expansion.replace(/(\r?\n|\r)| /g, "");

        if (expansion.length == 0) return [];

        return Expansion._splitExpansions(expansion).map(e => Expansion._parse(ownerType, e));
    }

    /**
     * Parses a single expansion string that may contain nested expansions.
     */
    private static _parse(ownerType: EntityType<any>, expansion: string): Expansion {
        // index for if there are nested expansions
        let nestedStart = expansion.indexOf("/");
        let name = nestedStart == -1 ? expansion : expansion.substring(0, nestedStart);
        let property = getEntityMetadata(ownerType).getNavigation(name);

        if (property == null) throw `unknown navigation property: ${name}`;

        if (name.length == expansion.length) {
            return new Expansion({ property: property });
        }

        let hasGroupedExpansions = expansion[nestedStart + 1] == "{";

        if (!hasGroupedExpansions) {
            return new Expansion({
                property: property,
                expansions: [Expansion._parse(property.otherType, expansion.substr(nestedStart + 1))]
            });
        } else {
            let endsProperly = expansion[expansion.length - 1] == "}";
            if (!endsProperly) throw "no closing brace in expansion";

            return new Expansion({
                property: property,
                expansions: Expansion._splitExpansions(expansion.substring(nestedStart + 2, expansion.length - 1)).map(e => Expansion._parse(property.otherType, e))
            });
        }
    }

    /**
     * Split a string that may contain multiple expansions into single expansion strings.
     */
    private static _splitExpansions(str: string): string[] {
        let cutpoints = new Array<number>();
        let i = 0;
        let openBraces = 0;

        while (i < str.length) {
            let c = str[i];

            if (openBraces == 0 && c == ",") {
                cutpoints.push(i);
            } else if (c == "{") {
                openBraces++;
            } else if (c == "}") {
                openBraces--;
            }

            i++;
        }

        if (cutpoints.length == 0) return [str];

        let offset = 0;

        return cutpoints.concat([str.length]).map(c => {
            let e = str.substring(offset, c);
            offset = c + 1;
            return e;
        });
    }

    /**
     * Determines if this is a superset of 'other', securing that an operation on this expansion
     * leads to a superset of 'other' when using the same operation on 'other'.
     */
    isSupersetOf(other: Expansion): boolean {
        return Expansion.isSuperset(this, other);
    }

    isSubsetOf(other: Expansion): boolean {
        return Expansion.isSuperset(other, this);
    }

    /**
     * If this expansion equals another expansion (string representation is used for equality check).
     */
    equals(other: Expansion): boolean {
        return Expansion.equals(this, other);
    }

    /**
     * Extract all expansions that match against the predicate.
     * Only first occurences are extracted.
     *
     * Returns the reduced expansion and the extractions.
     */
    extract(predicate: (p: Expansion) => boolean): [Expansion, Extraction[]] {
        let extractions = new Array<Extraction>();
        let expansions = new Array<Expansion>();

        this.expansions.forEach(exp => {
            if (predicate(exp)) {
                extractions.push(new Extraction({
                    path: new Path({ property: this.property }),
                    extracted: exp
                }));
            } else {
                let [subExpansion, subExtracted] = exp.extract(predicate);

                expansions.push(subExpansion);

                subExtracted.forEach(ext => {
                    extractions.push(new Extraction({
                        path: new Path({
                            property: this.property,
                            next: ext.path
                        }),
                        extracted: ext.extracted
                    }));
                });
            }
        });

        return [new Expansion({
            property: this.property,
            expansions: expansions
        }), extractions];
    }

    /**
     * Returns a flattened representation of this expansion.
     */
    toPaths(): Path[] {
        if (this.expansions.length == 0) {
            return [new Path({ property: this.property })];
        }

        let paths = new Array<Path>();
        this.expansions.forEach(exp => exp.toPaths().forEach(p => paths.push(new Path({ property: this.property, next: p }))));

        return paths;
    }

    toString(): string {
        if (this._toStringValue == null) {
            let str = this.property.name;

            if (this.expansions.length > 0) {

                let expansions = this.expansions.map(exp => exp.toString()).join(",");

                if (this.expansions.length > 1) {
                    expansions = `{${expansions}}`;
                }

                str += `/${expansions}`;
            }

            this._toStringValue = str;
        }

        return this._toStringValue;
    }
}
