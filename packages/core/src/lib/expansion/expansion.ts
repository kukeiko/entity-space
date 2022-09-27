import { ExpansionObject } from "./expansion-object";

export class Expansion<E extends ExpansionObject = ExpansionObject> {
    constructor(object: E) {
        this.object = object;
    }

    private readonly object: E;

    getObject(): E {
        return this.object;
    }

    isEmpty(): boolean {
        return Object.keys(this.object).length === 0;
    }

    reduce(other: Expansion): boolean | Expansion {
        if (other.isEmpty()) {
            return true;
        }

        const reducedObject = Expansion.reduceObject(other.getObject(), this.getObject());

        if (reducedObject === true) {
            return true;
        } else if (reducedObject === false) {
            return false;
        } else {
            return new Expansion(reducedObject);
        }
    }

    /**
     * [todo] added for convenience
     */
    reduce_alt(other: Expansion): Expansion {
        const result = this.reduce(other);

        if (result === true) {
            return new Expansion({});
        } else if (result === false) {
            return other;
        } else {
            return result;
        }
    }

    intersect(other: Expansion): false | Expansion {
        const objectIntersection = Expansion.intersectObjects(this.getObject(), other.getObject());

        return objectIntersection ? new Expansion(objectIntersection) : false;
    }

    static intersectObjects(a: ExpansionObject, b: ExpansionObject): false | ExpansionObject {
        const intersection: ExpansionObject = {};

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
                    intersection[key] = this.intersectObjects(myValue, otherValue);
                }
            }
        }

        return Object.keys(intersection).length ? intersection : false;
    }

    merge(other: Expansion): Expansion {
        return new Expansion(Expansion.mergeObjects(this.getObject(), other.getObject()));
    }

    static copyObject(object: ExpansionObject): ExpansionObject {
        return this.mergeObjects(object);
    }

    static mergeObjects(...objects: ExpansionObject[]): ExpansionObject {
        const merged: ExpansionObject = {};

        for (const selection of objects) {
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
                        merged[key] = this.mergeObjects(right);
                    }
                } else if (right !== true) {
                    merged[key] = this.mergeObjects(left, right);
                }
            }
        }

        return merged;
    }

    static reduceObject(what: ExpansionObject, by: ExpansionObject): boolean | ExpansionObject {
        if (Object.keys(what).length === 0) {
            return true;
        }

        const reduced = this.copyObject(what);
        let didReduce = false;

        for (const key in by) {
            if (what[key] === void 0) {
                continue;
            } else if (by[key] === true) {
                if (what[key] === true || Object.keys(what[key] ?? {}).length === 0) {
                    delete reduced[key];
                    didReduce = true;
                }
            } else if (by[key] instanceof Object) {
                const subReduced = this.reduceObject(reduced[key] as ExpansionObject, by[key] as ExpansionObject);

                if (!subReduced) {
                    continue;
                } else if (Object.keys(subReduced).length === 0) {
                    delete reduced[key];
                    didReduce = true;
                } else {
                    reduced[key] = subReduced;
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
