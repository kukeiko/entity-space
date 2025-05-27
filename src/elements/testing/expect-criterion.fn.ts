import { expect, test, TestAPI } from "vitest";
import { Criterion } from "../criteria/criterion";
import { CriterionShape } from "../criteria/criterion-shape";
import { intersectCriterion } from "../criteria/intersect/intersect-criterion.fn";
import { invertCriterion } from "../criteria/invert/invert-criterion.fn";
import { mergeCriterion } from "../criteria/merge/merge-criterion.fn";
import { parseCriterion } from "../criteria/parse/parse-criterion.fn";
import { reshapeCriterion } from "../criteria/reshape/reshape-criterion.fn";
import { subtractCriterion } from "../criteria/subtract/subtract-criterion.fn";

const parse = (input: string) => parseCriterion(input);

export function expectCriterion(
    criteria: string,
    specFn: TestAPI | TestAPI["skip"] = test,
): {
    intersect(other: string): { toEqual(expected: string | false): void };
    inverted(): { toEqual(expected: string | false): void };
    plus(other: string): { toEqual(expected: string | boolean): void };
    minus(other: string): { toEqual(expected: string | boolean): void };
    reshapedUsing(
        shape: CriterionShape | CriterionShape[],
        label?: string,
    ): { toEqual(reshaped: string[] | string | false, open?: string[]): void };
} {
    return {
        intersect(other) {
            return {
                toEqual(expected) {
                    if (expected === false) {
                        specFn(`${criteria} ∩ ${other} = (incompatible)`, () => {
                            expect(intersectCriterion(parse(criteria), parse(other)).toString()).toEqual("false");
                        });
                    } else {
                        specFn(`${criteria} ∩ ${other} = ${expected}`, () => {
                            expect(intersectCriterion(parse(criteria), parse(other)).toString()).toEqual(
                                parse(expected).toString(),
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
                            expect(invertCriterion(parse(criteria))).toEqual(false);
                        });
                    } else {
                        specFn(`inverse of ${criteria} = ${expected}`, () => {
                            expect(invertCriterion(parse(criteria)).toString()).toEqual(parse(expected).toString());
                        });
                    }
                },
            };
        },
        plus(other) {
            return {
                toEqual(expected) {
                    if (expected === false) {
                        specFn(`${criteria} + ${other} = (incompatible)`, () => {
                            expect(mergeCriterion(parse(criteria), parse(other)).toString()).toEqual("false");
                        });
                    } else if (expected === true) {
                        specFn(`${criteria} + ${other} = (empty)`, () => {
                            expect(mergeCriterion(parse(criteria), parse(other)).toString()).toEqual("true");
                        });
                    } else {
                        specFn(`${criteria} + ${other} = ${expected}`, () => {
                            expect(mergeCriterion(parse(criteria), parse(other)).toString()).toEqual(
                                parse(expected).toString(),
                            );
                        });
                    }
                },
            };
        },
        minus(other) {
            return {
                toEqual(expected: string | boolean) {
                    const subtract = (what: string, by: string): Criterion | boolean => {
                        return subtractCriterion(parse(what), parse(by));
                    };

                    if (expected === true) {
                        specFn(`${criteria} - ${other} = (empty)`, () => {
                            expect(subtract(criteria, other).toString()).toEqual("true");
                        });
                    } else if (expected === false) {
                        specFn(`${criteria} - ${other} = (incompatible)`, () => {
                            expect(subtract(criteria, other).toString()).toEqual("false");
                        });
                    } else {
                        specFn(`${criteria} - ${other} = ${expected}`, () => {
                            expect(subtract(criteria, other).toString()).toEqual(parse(expected).toString());
                        });
                    }
                },
            };
        },
        reshapedUsing(shape, label?) {
            const shapes = Array.isArray(shape) ? shape : [shape];
            return {
                toEqual(reshaped: string[] | string | false, open: string[] = []) {
                    const shapeNames = label ?? shapes.map(shape => (shape as any).constructor.name).join(", ");

                    if (reshaped === false) {
                        specFn(`${criteria} should not reshape using ${shapeNames}`, () => {
                            expect(reshapeCriterion(shapes, parse(criteria))).toEqual(false);
                        });
                    } else {
                        const reshapedString =
                            typeof reshaped === "string"
                                ? parse(reshaped).toString()
                                : `${reshaped.map(x => parse(x)).join(", ")}`;

                        if (open.length === 0) {
                            specFn(`${criteria} should fully reshape using ${shapeNames} to ${reshapedString}`, () => {
                                const result = reshapeCriterion(shapes, parse(criteria));
                                expect(result).not.toBe(false);

                                if (result !== false) {
                                    expect(result.getReshaped().join(", ")).toEqual(reshapedString);
                                }
                            });
                        } else {
                            const openString = open.join(", ");

                            specFn(
                                `${criteria} should reshape using ${shapeNames} to ${reshapedString}, leaving ${openString}`,
                                () => {
                                    const result = reshapeCriterion(shapes, parse(criteria));
                                    expect(result).not.toBe(false);

                                    if (result !== false) {
                                        expect(result.getReshaped().join(", ")).toEqual(reshapedString);
                                        expect(result.getOpen().join(", ")).toEqual(open.join(", "));
                                    }
                                },
                            );
                        }
                    }
                },
            };
        },
    };
}
