import { UnpackedEntitySelection, IEntitySchema, PackedEntitySelection, Entity } from "@entity-space/common";
import { toMap } from "@entity-space/utils";

// [todo] implement toUnfoldedExpansion()
export class EntitySelection {
    constructor({ schema, value }: { value: UnpackedEntitySelection; schema: IEntitySchema }) {
        this.value = value;
        this.schema = schema;
    }

    private readonly value: UnpackedEntitySelection;
    private readonly schema: IEntitySchema;

    getValue(): UnpackedEntitySelection {
        return this.value;
    }

    isEmpty(): boolean {
        return Object.keys(this.value).length === 0;
    }

    toString(): string {
        return EntitySelection.toString(this.value);
    }

    static toString(value?: UnpackedEntitySelection): string {
        // [todo] expansion value allowing undefined is a bit of a pain, gotta fix that somehow.
        if (value === void 0) {
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

        const subtracted = EntitySelection.subtractValue(other.getValue(), this.getValue());

        if (typeof subtracted == "boolean") {
            return subtracted;
        } else {
            return new EntitySelection({ schema: this.schema, value: subtracted });
        }
    }

    intersect(other: EntitySelection): false | EntitySelection {
        const intersection = EntitySelection.intersectValues(this.getValue(), other.getValue());

        return intersection ? new EntitySelection({ schema: this.schema, value: intersection }) : false;
    }

    equivalent(other: EntitySelection): boolean {
        return other.subtractFrom(this) === true && this.subtractFrom(other) === true;
    }

    static intersectValues(a: UnpackedEntitySelection, b: UnpackedEntitySelection): false | UnpackedEntitySelection {
        const intersection: UnpackedEntitySelection = {};

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
                    // [todo] better error message
                    throw new Error("intersection between incompatible selections");
                }
            } else {
                if (otherValue === true) {
                    // [todo] better error message
                    throw new Error("intersection between incompatible selections");
                } else {
                    const intersectedValue = this.intersectValues(myValue, otherValue);

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
            value: EntitySelection.mergeValues(this.getValue(), other.getValue()),
        });
    }

    static copyValue(object: UnpackedEntitySelection): Exclude<UnpackedEntitySelection, true> {
        return this.mergeValues(object);
    }

    static mergeValues<T extends Entity = Entity>(
        ...selections: UnpackedEntitySelection<T>[]
    ): Exclude<UnpackedEntitySelection<T>, true> {
        const merged: Exclude<UnpackedEntitySelection, true> = {};

        for (let selection of selections) {
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
                        merged[key] = this.mergeValues(right);
                    }
                } else if (right !== true) {
                    merged[key] = this.mergeValues(left, right);
                }
            }
        }

        return merged as Exclude<UnpackedEntitySelection<T>, true>;
    }

    static subtractValue(
        what: UnpackedEntitySelection,
        by: UnpackedEntitySelection
    ): boolean | UnpackedEntitySelection {
        if (Object.keys(what).length === 0) {
            return true;
        }

        const reduced: Exclude<UnpackedEntitySelection, true> = this.copyValue(what);
        let didReduce = false;

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
                const subReduced = this.subtractValue(whatValue, byValue);

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

    static unpack<T extends Entity>(
        schema: IEntitySchema<T>,
        selection: PackedEntitySelection
    ): UnpackedEntitySelection<T> {
        const unpacked: UnpackedEntitySelection = schema.getDefaultSelection();

        if (selection === true) {
            return unpacked as UnpackedEntitySelection<T>;
        }

        const properties = toMap(schema.getProperties(), property => property.getName());

        for (const key in selection) {
            const value = selection[key];

            if (!value) {
                continue;
            }

            const property = properties.get(key);

            if (!property) {
                // just copy over the value if we don't know about this property,
                // as users might not have fully described their entities
                unpacked[key] = value;
                continue;
            }

            const valueSchema = property.getUnboxedValueSchema();

            if (value === true) {
                if (!property.isRequired()) {
                    if (valueSchema.schemaType === "entity") {
                        unpacked[key] = valueSchema.getDefaultSelection();
                    } else {
                        unpacked[key] = true;
                    }
                }

                continue;
            }

            if (valueSchema.schemaType !== "entity") {
                throw new Error(`in an EntitySelection, you can only provide "true" for primitive properties`);
            }

            unpacked[key] = this.unpack(valueSchema, value);
        }

        return unpacked as UnpackedEntitySelection<T>;
    }
}
