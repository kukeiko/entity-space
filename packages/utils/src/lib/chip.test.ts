import { chip } from "./chip.fn";

describe("chip()", () => {
    it("should split off 'foo' off of 'foo.bar.baz'", () => {
        // arrange
        const subject = "foo.bar.baz";
        const separator = ".";
        const expected = ["foo", "bar.baz"];

        // act
        const actual = chip(subject, separator);

        // assert
        expect(actual).toEqual(expected);
    });
});
