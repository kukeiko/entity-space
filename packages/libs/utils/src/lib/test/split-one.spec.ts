import { splitOne } from "../split-one.fn";

describe("splitOne()", () => {
    it("should work", () => {
        const subject = "foo.bar.baz";
        const separator = ".";
        const expected = ["foo", "bar.baz"];

        const actual = splitOne(subject, separator);

        expect(actual).toEqual(expected);
    });
});
