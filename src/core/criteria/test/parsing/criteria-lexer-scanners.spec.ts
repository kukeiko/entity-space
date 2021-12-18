import { scanNumber, scanString, scanSymbol } from "../../parser";

describe("criteria-lexer-scanners", () => {
    function shouldScan(
        input: string,
        type: string,
        scanner: (char: string, iterator: IterableIterator<string>) => [string, IteratorResult<string>],
        expected = input
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

    function shouldScanSymbol(input: string, expected?: string): void {
        shouldScan(input, "symbol", scanSymbol, expected);
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
        expect(scan).toThrow();
    });

    // symbols
    shouldScanSymbol("abc123", "abc");
    shouldScanSymbol("a-b_c123", "a-b_c");
    shouldScanSymbol("a-b_c.", "a-b_c");
    shouldScanSymbol("_foo", "_foo");
    shouldScanSymbol("-foo", "-foo");
});
