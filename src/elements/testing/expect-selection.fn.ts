import { expect, test, TestAPI } from "vitest";
import { intersectSelection } from "../selection/intersect-selection.fn";
import { mergeSelection } from "../selection/merge-selection.fn";
import { parseSelection } from "../selection/parse-selection.fn";
import { selectionToString } from "../selection/selection-to-string.fn";
import { subtractSelection } from "../selection/subtract-selection.fn";

const parse = (input: string) => parseSelection(input);

export function expectSelection(
    selection: string,
    specFn: TestAPI | TestAPI["skip"] = test,
): {
    intersect(other: string): { toEqual(expected: string | false): void; toThrowError(message?: string): void };
    plus(other: string): { toEqual(expected: string): void; toThrowError(message?: string): void };
    minus(other: string): { toEqual(expected: string | boolean): void; toThrowError(message?: string): void };
} {
    return {
        intersect(other) {
            return {
                toEqual(expected) {
                    if (expected === false) {
                        specFn(`${selection} ∩ ${other} = (incompatible)`, () => {
                            expect(intersectSelection(parse(selection), parse(other))).toEqual(false);
                        });
                    } else {
                        specFn(`${selection} ∩ ${other} = ${expected}`, () => {
                            const result = intersectSelection(parse(selection), parse(other));

                            if (typeof result === "boolean") {
                                expect(result.toString()).toEqual(selectionToString(parse(expected)));
                            } else {
                                expect(selectionToString(result)).toEqual(selectionToString(parse(expected)));
                            }
                        });
                    }
                },
                toThrowError(message?: string) {
                    specFn(`${selection} ∩ ${other} throws: ${message ?? "Error"}`, () => {
                        const intersect = () => intersectSelection(parse(selection), parse(other));
                        expect(intersect).toThrowError(message);
                    });
                },
            };
        },
        plus(other) {
            return {
                toEqual(expected) {
                    specFn(`${selection} + ${other} = ${expected}`, () => {
                        expect(selectionToString(mergeSelection(parse(selection), parse(other)))).toEqual(
                            selectionToString(parse(expected)),
                        );
                    });
                },
                toThrowError(message?: string) {
                    specFn(`${selection} + ${other} throws: ${message ?? "Error"}`, () => {
                        const merge = () => mergeSelection(parse(selection), parse(other));
                        expect(merge).toThrowError(message);
                    });
                },
            };
        },
        minus(other) {
            return {
                toEqual(expected: string | boolean) {
                    if (expected === true) {
                        specFn(`${selection} - ${other} = (empty)`, () => {
                            expect(subtractSelection(parse(selection), parse(other))).toEqual(true);
                        });
                    } else if (expected === false) {
                        specFn(`${selection} - ${other} = (incompatible)`, () => {
                            expect(subtractSelection(parse(selection), parse(other))).toEqual(false);
                        });
                    } else {
                        specFn(`${selection} - ${other} = ${expected}`, () => {
                            const result = subtractSelection(parse(selection), parse(other));

                            if (typeof result === "boolean") {
                                expect(result.toString()).toEqual(selectionToString(parse(expected)));
                            } else {
                                expect(selectionToString(result)).toEqual(selectionToString(parse(expected)));
                            }
                        });
                    }
                },
                toThrowError(message?: string) {
                    specFn(`${selection} - ${other} throws: ${message ?? "Error"}`, () => {
                        const subtract = () => subtractSelection(parse(selection), parse(other));
                        expect(subtract).toThrowError(message);
                    });
                },
            };
        },
    };
}
