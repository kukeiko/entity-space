import { describe, expect, it } from "vitest";
import {
    isPrimitive,
    isPrimitiveType,
    Null,
    primitiveToString,
    primitiveToType,
    primitiveTypeToString,
    Undefined,
} from "./primitive";

describe("Primitive", () => {
    describe(primitiveToString, () => {
        it("should return null for null", () => {
            expect(primitiveToString(null)).toEqual("null");
        });

        it("should return undefined for undefined", () => {
            expect(primitiveToString(undefined)).toEqual("undefined");
        });

        it("should return true for true", () => {
            expect(primitiveToString(true)).toEqual("true");
        });

        it("should return false for false", () => {
            expect(primitiveToString(false)).toEqual("false");
        });

        it("should return 1 for 1", () => {
            expect(primitiveToString(1)).toEqual("1");
        });

        it(`should return "foo" for "foo"`, () => {
            expect(primitiveToString("foo")).toEqual(`"foo"`);
        });
    });

    describe(primitiveTypeToString, () => {
        it("should return null for Null", () => {
            expect(primitiveTypeToString(Null)).toEqual("null");
        });

        it("should return undefined for Undefined", () => {
            expect(primitiveTypeToString(Undefined)).toEqual("undefined");
        });

        it("should return boolean for Boolean", () => {
            expect(primitiveTypeToString(Boolean)).toEqual("boolean");
        });

        it("should return number for Number", () => {
            expect(primitiveTypeToString(Number)).toEqual("number");
        });

        it("should return string for String", () => {
            expect(primitiveTypeToString(String)).toEqual("string");
        });

        it("should throw error if given {}", () => {
            expect(() => primitiveTypeToString({} as any)).toThrowError("type [object Object] is not a Primitive");
        });
    });

    describe(primitiveToType, () => {
        it("should return Null for null", () => {
            expect(primitiveToType(null)).toBe(Null);
        });

        it("should return Undefined for undefined", () => {
            expect(primitiveToType(undefined)).toBe(Undefined);
        });

        it("should return Boolean for true", () => {
            expect(primitiveToType(true)).toBe(Boolean);
        });

        it("should return Boolean for false", () => {
            expect(primitiveToType(false)).toBe(Boolean);
        });

        it("should return Number for 1", () => {
            expect(primitiveToType(1)).toBe(Number);
        });

        it(`should return String for "foo"`, () => {
            expect(primitiveToType("foo")).toBe(String);
        });

        it("should throw error if given {}", () => {
            expect(() => primitiveToType({} as any)).toThrowError("value [object Object] is not a primitive value");
        });
    });

    describe(isPrimitiveType, () => {
        it("should be true for Null", () => {
            expect(isPrimitiveType(Null)).toEqual(true);
        });

        it("should be true for Undefined", () => {
            expect(isPrimitiveType(Undefined)).toEqual(true);
        });

        it("should be true for Boolean", () => {
            expect(isPrimitiveType(Boolean)).toEqual(true);
        });

        it("should be true for Number", () => {
            expect(isPrimitiveType(Number)).toEqual(true);
        });

        it("should be true for String", () => {
            expect(isPrimitiveType(String)).toEqual(true);
        });

        it("should be false for Map", () => {
            expect(isPrimitiveType(Map)).toEqual(false);
        });
    });

    describe(isPrimitive, () => {
        it("should be true for null", () => {
            expect(isPrimitive(null)).toEqual(true);
        });

        it("should be true for undefined", () => {
            expect(isPrimitive(undefined)).toEqual(true);
        });

        it("should be true for true", () => {
            expect(isPrimitive(true)).toEqual(true);
        });

        it("should be true for false", () => {
            expect(isPrimitive(false)).toEqual(true);
        });

        it("should be true for 1", () => {
            expect(isPrimitive(1)).toEqual(true);
        });

        it(`should be true for "foo"`, () => {
            expect(isPrimitive("foo")).toEqual(true);
        });

        it("should be false for new Map()", () => {
            expect(isPrimitive(new Map())).toEqual(false);
        });
    });
});
