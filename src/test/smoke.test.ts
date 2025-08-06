import { describe, expect, it } from "vitest";

describe("smoke", () => {
    it("expect(...).toEqual(...) should check for reference equality on structurally equal objects", () => {
        const foo = { a: { b: {} } };
        foo.a.b = foo.a;
        const bar = { a: { b: { a: { b: {} } } } };
        bar.a.b.a.b = bar.a;

        expect(foo).not.toEqual(bar);
    });
});
