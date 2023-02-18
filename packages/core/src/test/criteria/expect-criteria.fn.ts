import { ICriterionShape } from "../../lib/criteria/criterion-shape.interface";
import { ICriterion } from "../../lib/criteria/criterion.interface";
import { EntityCriteriaTools } from "../../lib/criteria/entity-criteria-tools";
import { parseCriteria } from "../../lib/criteria/parsing/parse-criteria.fn";

const factory = new EntityCriteriaTools();
const parse = (input: string) => parseCriteria(factory, input);

export function expectCriteria(
    criteria: string,
    specFn = it
): {
    intersectedWith(other: string): { toEqual(expected: string | false): void };
    inverted(): { toEqual(expected: string | false): void };
    mergedWith(other: string): { toEqual(expected: string | false): void };
    minus(other: string): { toEqual(expected: string | boolean): void };
    remappedUsing(
        shape: ICriterionShape<ICriterion, unknown>,
        label?: string
    ): { toEqual(remapped: string[] | string | false, open?: string[]): void };
} {
    return {
        intersectedWith(other) {
            return {
                toEqual(expected) {
                    if (expected === false) {
                        specFn(`${criteria} should not intersect with ${other}`, () => {
                            expect(parse(criteria).intersect(parse(other)).toString()).toEqual("false");
                        });
                    } else {
                        specFn(`${criteria} intersected with ${other} should be ${expected}`, () => {
                            expect(parse(criteria).intersect(parse(other)).toString()).toEqual(
                                parse(expected).toString()
                            );
                        });
                    }
                },
            };
        },
        inverted() {
            return {
                toEqual(expected) {
                    if (expected === false) {
                        specFn(`${criteria} should not be invertible`, () => {
                            expect(parse(criteria).invert()).toEqual(false);
                        });
                    } else {
                        specFn(`${criteria} inverted should be ${expected}`, () => {
                            expect(parse(criteria).invert().toString()).toEqual(parse(expected).toString());
                        });
                    }
                },
            };
        },
        mergedWith(other) {
            return {
                toEqual(expected) {
                    if (expected === false) {
                        specFn(`${criteria} should not merge with ${other}`, () => {
                            expect(parse(criteria).merge(parse(other)).toString()).toEqual("false");
                        });
                    } else {
                        specFn(`${criteria} merged with ${other} should be ${expected}`, () => {
                            expect(parse(criteria).merge(parse(other)).toString()).toEqual(parse(expected).toString());
                        });
                    }
                },
            };
        },
        minus(other) {
            return {
                toEqual(expected: string | boolean) {
                    if (expected === true) {
                        specFn(`${criteria} should be fully subtracted by ${other}`, () => {
                            expect(parse(other).subtractFrom(parse(criteria)).toString()).toEqual("true");
                        });
                    } else if (expected === false) {
                        specFn(`${criteria} should not be subtracted by ${other}`, () => {
                            expect(parse(other).subtractFrom(parse(criteria)).toString()).toEqual("false");
                        });
                    } else {
                        specFn(`${criteria} minus ${other} should be ${expected}`, () => {
                            expect(parse(other).subtractFrom(parse(criteria)).toString()).toEqual(
                                parse(expected).toString()
                            );
                        });
                    }
                },
            };
        },
        remappedUsing(shape, label?) {
            return {
                toEqual(remapped: string[] | string | false, open: string[] = []) {
                    const shapeName = label ?? (shape as any).constructor.name;

                    if (remapped === false) {
                        specFn(`${criteria} should not reshape using ${shapeName}`, () => {
                            expect(shape.reshape(parse(criteria))).toEqual(false);
                        });
                    } else {
                        const remappedString = typeof remapped === "string" ? remapped : `${remapped.join(", ")}`;

                        if (open.length === 0) {
                            specFn(`${criteria} should fully reshape using ${shapeName} to ${remappedString}`, () => {
                                const result = shape.reshape(parse(criteria));
                                expect(result).not.toBe(false);

                                if (result !== false) {
                                    expect(result.getReshaped().join(", ")).toEqual(remappedString);
                                }
                            });
                        } else {
                            const openString = open.join(", ");

                            specFn(
                                `${criteria} should reshape using ${shapeName} to ${remappedString}, leaving ${openString}`,
                                () => {
                                    const result = shape.reshape(parse(criteria));
                                    expect(result).not.toBe(false);

                                    if (result !== false) {
                                        expect(result.getReshaped().join(", ")).toEqual(remappedString);
                                        expect(result.getOpen().join(", ")).toEqual(open.join(", "));
                                    }
                                }
                            );
                        }
                    }
                },
            };
        },
    };
}
