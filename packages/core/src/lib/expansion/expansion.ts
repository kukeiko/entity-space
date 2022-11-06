import { EntitySelectionValue, IEntitySchema } from "@entity-space/common";

// [todo] implement toUnfoldedExpansion()
export class EntitySelection {
    static create({ schema, value }: { value: EntitySelectionValue; schema: IEntitySchema }): EntitySelection {
        return new EntitySelection({ schema, value });
    }

    constructor({ schema, value }: { value: EntitySelectionValue; schema: IEntitySchema }) {
        this.value = value;
        this.schema = schema;
    }

    private readonly value: EntitySelectionValue;
    private readonly schema: IEntitySchema;

    getValue(): EntitySelectionValue {
        return this.value;
    }

    isEmpty(): boolean {
        return Object.keys(this.value).length === 0;
    }

    toString(): string {
        return EntitySelection.toString(this.value);
    }

    static toString(value?: EntitySelectionValue): string {
        // [todo] expansion value allowing undefined is a bit of a pain, gotta fix that somehow.
        if (value === true || value === void 0) {
            return "";
        }

        return `{ ${Object.entries(value)
            .map(([key, value]) => (value === true ? key : `${key}: ${this.toString(value)}`))
            .join(", ")} }`;
    }

    subtractFrom(other: EntitySelection): boolean | EntitySelection {
        if (other.isEmpty()) {
            return true;
        }

        const subtracted = EntitySelection.subtractValue(this.schema, other.getValue(), this.getValue());

        if (typeof subtracted == "boolean") {
            return subtracted;
        } else {
            return new EntitySelection({ schema: this.schema, value: subtracted });
        }
    }

    intersect(other: EntitySelection): false | EntitySelection {
        const intersection = EntitySelection.intersectValues(this.schema, this.getValue(), other.getValue());

        return intersection ? new EntitySelection({ schema: this.schema, value: intersection }) : false;
    }

    equivalent(other: EntitySelection): boolean {
        return other.subtractFrom(this) === true && this.subtractFrom(other) === true;
    }

    static intersectValues(schema: IEntitySchema, a: EntitySelectionValue, b: EntitySelectionValue): false | EntitySelectionValue {
        const intersection: EntitySelectionValue = {};

        if (a === true) {
            a = schema.getDefaultSelection();
        }

        if (b === true) {
            b = schema.getDefaultSelection();
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

    merge(other: EntitySelection): EntitySelection {
        return new EntitySelection({
            schema: this.schema,
            value: EntitySelection.mergeValues(this.schema, this.getValue(), other.getValue()),
        });
    }

    static copyValue(schema: IEntitySchema, object: EntitySelectionValue): Exclude<EntitySelectionValue, true> {
        return this.mergeValues(schema, object);
    }

    static mergeValues(schema: IEntitySchema, ...objects: EntitySelectionValue[]): Exclude<EntitySelectionValue, true> {
        const merged: EntitySelectionValue = {};

        for (let selection of objects) {
            if (selection === true) {
                selection = schema.getDefaultSelection();
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

    static subtractValue(schema: IEntitySchema, what: EntitySelectionValue, by: EntitySelectionValue): boolean | EntitySelectionValue {
        if (Object.keys(what).length === 0) {
            return true;
        }

        const reduced: Exclude<EntitySelectionValue, true> = this.copyValue(schema, what);
        let didReduce = false;

        if (what === true) {
            what = schema.getDefaultSelection();
        }

        if (by === true) {
            by = schema.getDefaultSelection();
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
                const subReduced = this.subtractValue(
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
