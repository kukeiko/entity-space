import { ExpansionValue } from "@entity-space/common";
import { IEntitySchema } from "../schema/schema.interface";

// [todo] implement toUnfoldedExpansion()
export class Expansion {
    static create({ schema, value }: { value: ExpansionValue; schema: IEntitySchema }): Expansion {
        return new Expansion({ schema, value });
    }

    constructor({ schema, value }: { value: ExpansionValue; schema: IEntitySchema }) {
        this.value = value;
        this.schema = schema;
    }

    private readonly value: ExpansionValue;
    private readonly schema: IEntitySchema;

    getValue(): ExpansionValue {
        return this.value;
    }

    isEmpty(): boolean {
        return Object.keys(this.value).length === 0;
    }

    toString(): string {
        return Expansion.toString(this.value);
    }

    static toString(value?: ExpansionValue): string {
        // [todo] expansion value allowing undefined is a bit of a pain, gotta fix that somehow.
        if (value === true || value === void 0) {
            return "";
        }

        return `{ ${Object.entries(value)
            .map(([key, value]) => (value === true ? key : `${key}: ${this.toString(value)}`))
            .join(", ")} }`;
    }

    reduce(other: Expansion): boolean | Expansion {
        if (other.isEmpty()) {
            return true;
        }

        const reduced = Expansion.reduceValue(this.schema, other.getValue(), this.getValue());

        if (typeof reduced == "boolean") {
            return reduced;
        } else {
            return new Expansion({ schema: this.schema, value: reduced });
        }
    }

    intersect(other: Expansion): false | Expansion {
        const intersection = Expansion.intersectValues(this.schema, this.getValue(), other.getValue());

        return intersection ? new Expansion({ schema: this.schema, value: intersection }) : false;
    }

    equivalent(other: Expansion): boolean {
        return other.reduce(this) === true && this.reduce(other) === true;
    }

    static intersectValues(schema: IEntitySchema, a: ExpansionValue, b: ExpansionValue): false | ExpansionValue {
        const intersection: ExpansionValue = {};

        if (a === true) {
            a = schema.getDefaultExpansion();
        }

        if (b === true) {
            b = schema.getDefaultExpansion();
        }

        for (const key in a) {
            const myValue = a[key];
            const otherValue = b[key];

            if (myValue === void 0 || otherValue === void 0) {
                continue;
            }

            if (myValue === true) {
                if (otherValue === true) {
                    intersection[key] = true;
                } else {
                    intersection[key] = otherValue;
                }
            } else {
                if (otherValue === true) {
                    intersection[key] = myValue;
                } else {
                    const relatedSchema = schema.getRelation(key).getRelatedEntitySchema();
                    const intersectedValue = this.intersectValues(relatedSchema, myValue, otherValue);

                    if (intersectedValue) {
                        intersection[key] = intersectedValue;
                    }
                }
            }
        }

        return Object.keys(intersection).length ? intersection : false;
    }

    merge(other: Expansion): Expansion {
        return new Expansion({
            schema: this.schema,
            value: Expansion.mergeValues(this.schema, this.getValue(), other.getValue()),
        });
    }

    static copyValue(schema: IEntitySchema, object: ExpansionValue): Exclude<ExpansionValue, true> {
        return this.mergeValues(schema, object);
    }

    static mergeValues(schema: IEntitySchema, ...objects: ExpansionValue[]): Exclude<ExpansionValue, true> {
        const merged: ExpansionValue = {};

        for (let selection of objects) {
            if (selection === true) {
                selection = schema.getDefaultExpansion();
            }

            for (const key in selection) {
                const left = merged[key];
                const right = selection[key];

                if (right === void 0) {
                    continue;
                }

                if (left === void 0 || left === true) {
                    if (right === true) {
                        merged[key] = true;
                    } else {
                        merged[key] = this.mergeValues(schema.getRelation(key).getRelatedEntitySchema(), right);
                    }
                } else if (right !== true) {
                    merged[key] = this.mergeValues(schema.getRelation(key).getRelatedEntitySchema(), left, right);
                }
            }
        }

        return merged;
    }

    static reduceValue(schema: IEntitySchema, what: ExpansionValue, by: ExpansionValue): boolean | ExpansionValue {
        if (Object.keys(what).length === 0) {
            return true;
        }

        const reduced: Exclude<ExpansionValue, true> = this.copyValue(schema, what);
        let didReduce = false;

        if (what === true) {
            what = schema.getDefaultExpansion();
        }

        if (by === true) {
            by = schema.getDefaultExpansion();
        }

        for (const key in by) {
            const whatValue = what[key];
            const byValue = by[key];

            if (!whatValue) {
                continue;
            } else if (byValue === true) {
                if (whatValue === true || Object.keys(what[key] ?? {}).length === 0) {
                    delete reduced[key];
                    didReduce = true;
                }
            } else if (typeof byValue === "object" && typeof whatValue === "object") {
                const subReduced = this.reduceValue(
                    schema.getRelation(key).getRelatedEntitySchema(),
                    whatValue,
                    byValue
                );

                if (!subReduced) {
                    continue;
                } else if (Object.keys(subReduced).length === 0) {
                    delete reduced[key];
                    didReduce = true;
                } else {
                    reduced[key] = subReduced;
                    didReduce = true;
                }
            } else if (typeof byValue === "object" && whatValue === true) {
                if (Object.keys(byValue).length == 0) {
                    delete reduced[key];
                    didReduce = true;
                }
            }
        }

        if (!didReduce) {
            return false;
        } else if (Object.keys(reduced).length === 0) {
            return true;
        } else {
            return reduced;
        }
    }
}
