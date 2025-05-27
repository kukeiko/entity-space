import { describe, expect, it } from "vitest";
import { assertValidPaths, readPath, toPath, toPaths, toPathSegments, writePath } from "./path";

describe("Path", () => {
    describe(toPath, () => {
        it("should create a wrapped string", () => {
            const foo = toPath("foo");
            expect(foo instanceof String).toBe(true);
        });

        it(`should allow creating "foo.bar"`, () => {
            const foo = toPath("foo.bar");
            expect(foo instanceof String).toBe(true);
        });

        it(`should allow creating "_foo.bar"`, () => {
            const foo = toPath("_foo.bar");
            expect(foo instanceof String).toBe(true);
        });

        it(`should allow creating "$foo.bar"`, () => {
            const foo = toPath("$foo.bar");
            expect(foo instanceof String).toBe(true);
        });

        it(`should allow creating "!"§$%&/()=?#+-;, "`, () => {
            const foo = toPath(`!"§$%&/()=?#+-;, `);
            expect(foo instanceof String).toBe(true);
        });

        it(`should throw for ""`, () => {
            const create = () => toPath("");
            expect(create).toThrow(`"" is not a valid path because it's empty`);
        });

        it(`should throw for "."`, () => {
            const create = () => toPath(".");
            expect(create).toThrow(`"." contains an empty segment`);
        });

        it(`should throw for "foo."`, () => {
            const create = () => toPath("foo.");
            expect(create).toThrow(`"foo." contains an empty segment`);
        });

        it(`should throw for ".bar"`, () => {
            const create = () => toPath(".bar");
            expect(create).toThrow(`".bar" contains an empty segment`);
        });

        it("should throw if not given a string", () => {
            const create = () => toPath(1 as any);
            expect(create).toThrow(`"1" is not a valid path because it is not a string`);
        });
    });

    describe(toPathSegments, () => {
        it(`should return ["foo", "bar", "baz"] for "foo.bar.baz"`, () => {
            expect(toPathSegments(toPath("foo.bar.baz"))).toEqual(["foo", "bar", "baz"]);
        });

        it(`should return [" foo", "bar ", "b a z"] for " foo.bar .b a z"`, () => {
            expect(toPathSegments(toPath(" foo.bar .b a z"))).toEqual([" foo", "bar ", "b a z"]);
        });
    });

    describe(writePath, () => {
        it("should write a value onto object", () => {
            expect(writePath(toPath("foo"), {}, "value")).toEqual({ foo: "value" });
        });

        it("should write a value onto nested object", () => {
            expect(writePath(toPath("foo.bar"), {}, "value")).toEqual({ foo: { bar: "value" } });
        });
    });

    describe(readPath, () => {
        it("should read a value from object", () => {
            expect(readPath(toPath("foo"), { foo: "value" })).toEqual("value");
        });

        it("should read a value from nested object", () => {
            expect(readPath(toPath("foo.bar"), { foo: { bar: "value" } })).toEqual("value");
        });

        it("should return undefined if not found", () => {
            expect(readPath(toPath("foo.bar"), { foo: { notBar: "value" } })).toEqual(undefined);
        });

        it("should return an array when reading from an array of objects", () => {
            expect(
                readPath(toPath("foo.bar"), [{ foo: { bar: "value0" } }, { foo: {} }, { foo: { bar: "value1" } }]),
            ).toEqual(["value0", "value1"]);
        });
    });

    describe(assertValidPaths, () => {
        describe("should not throw", () => {
            it(`"foo.bar" & "baz.foo.bar"`, () => {
                const assert = () => assertValidPaths(toPaths(["foo.bar", "baz.foo.bar"]));
                expect(assert).not.toThrowError();
            });
        });

        it("should throw if array is empty", () => {
            expect(() => assertValidPaths([])).toThrowError("paths can't be empty");
        });

        it("should not throw if one path is contained in another, but neither of them contain dots", () => {
            const assert = () => assertValidPaths(toPaths(["f", "fo"]));
            expect(assert).not.toThrowError();
        });

        describe("should throw if one path is contained in another", () => {
            const errorMessage = "one path can't be contained in another";

            it(`"foo" & "foo"`, () => {
                const assert = () => assertValidPaths(toPaths(["foo", "foo"]));
                expect(assert).toThrowError(errorMessage);
            });

            it(`"foo.bar" & "foo"`, () => {
                const assert = () => assertValidPaths(toPaths(["foo.bar", "foo"]));
                expect(assert).toThrowError(errorMessage);
            });

            it(`"foo" & "foo.bar"`, () => {
                const assert = () => assertValidPaths(toPaths(["foo", "foo.bar"]));
                expect(assert).toThrowError(errorMessage);
            });
        });
    });
});
