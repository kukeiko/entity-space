import { describe, expect, it } from "vitest";
import { scanLiteral } from "./scan-literal.fn";
import { scanNumber } from "./scan-number.fn";
import { scanString } from "./scan-string.fn";

describe("scanners", () => {
    function shouldScan(
        input: string,
        type: string,
        scanner: (char: string, iterator: IterableIterator<string>) => [string, IteratorResult<string>],
        expected = input,
    ) {
        let title = `should scan ${type} ${input}`;

        if (input !== expected) {
            title += ` as ${expected}`;
        }

        it(title, () => {
            const iterator = input[Symbol.iterator]();
            iterator.next();
            const scan = () => scanner(input[0], iterator);
            expect(scan()[0]).toEqual(expected);
        });
    }

    function shouldScanLiteral(input: string, expected?: string): void {
        shouldScan(input, "literal", scanLiteral, expected);
    }

    function shouldScanNumber(input: string, expected?: string): void {
        shouldScan(input, "number", scanNumber, expected);
    }

    function shouldScanString(input: string, expected?: string): void {
        shouldScan(input, "string", scanString, expected);
    }

    // numbers
    shouldScanNumber("7");
    shouldScanNumber("777");
    shouldScanNumber("777.888");
    shouldScanNumber("123a", "123");
    shouldScanNumber("1.", "1.");
    shouldScanNumber("1.0", "1.0");
    shouldScanNumber("1.0.", "1.0");
    shouldScanNumber("-.9.123abc", "-.9");
    shouldScanNumber("+.9.", "+.9");

    // strings
    shouldScanString('"foo"', "foo");
    shouldScanString('"foo"bar', "foo");

    it("should throw if string is not terminated", () => {
        // arrange
        const value = '"foo';
        const iterator = value[Symbol.iterator]();
        iterator.next();
        const scan = () => scanString(value[0], iterator);

        // assert
        expect(scan).toThrow("string did not close");
    });

    // literals
    shouldScanLiteral("abc123", "abc");
    shouldScanLiteral("a-b_c123", "a-b_c");
    shouldScanLiteral("a-b_c.", "a-b_c.");
    shouldScanLiteral("_foo", "_foo");
    shouldScanLiteral("-foo", "-foo");
    shouldScanLiteral("null", "null");
    shouldScanLiteral("!null", "!null");
    shouldScanLiteral("undefined", "undefined");
    shouldScanLiteral("!undefined", "!undefined");
});
