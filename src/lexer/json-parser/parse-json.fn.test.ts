import { Json } from "@entity-space/utils";
import { describe, expect, it, TestAPI } from "vitest";
import { parseJson } from "./parse-json.fn";

describe(parseJson.name, () => {
    function shouldParse(stringified: string, expected: Json, specFn: TestAPI | TestAPI["skip"] = it): void {
        specFn(`should parse ${stringified} to ${JSON.stringify(expected)}`, () => {
            const parse = () => parseJson(stringified);
            expect(parse).not.toThrow();
            expect(parse()).toEqual(expected);
        });
    }

    function shouldNotParse(stringified: string, specFn: TestAPI | TestAPI["skip"] = it): void {
        specFn(`should not parse ${stringified}`, () => {
            const parse = () => parseJson(stringified);
            expect(parse).toThrow();
        });
    }

    // null
    shouldParse("null", null);
    shouldNotParse("Null");
    shouldNotParse("NULL");

    // true
    shouldParse("true", true);
    shouldNotParse("True");
    shouldNotParse("TRUE");

    // false
    shouldParse("false", false);
    shouldNotParse("False");
    shouldNotParse("FALSE");

    // number
    // integer
    shouldParse("1", 1);
    shouldParse("-1", -1);

    // float
    shouldParse("1.0", 1.0);
    shouldParse("1.2", 1.2);
    shouldParse("-1.2", -1.2);

    // string
    shouldParse('"foo"', "foo");
    shouldParse('"foo\\"bar"', 'foo"bar');
    shouldParse('"äöü"', "äöü");

    // array
    shouldParse("[]", []);
    shouldParse("[1]", [1]);
    shouldParse("[1,-1,0]", [1, -1, 0]);
    shouldNotParse("[1,]");
    shouldNotParse("[,]");
    shouldParse('[1, "foo"]', [1, "foo"]);
    shouldParse('[1, "foo", "bar\\"baz"]', [1, "foo", 'bar"baz']);

    // object
    shouldParse("{}", {});
    shouldParse('{ "foo": "bar" }', { foo: "bar" });
    shouldParse('{ "foo": [] }', { foo: [] });
    shouldParse('{ "foo": [{ "bar": "baz" }] }', { foo: [{ bar: "baz" }] });
    shouldParse('[{ "foo": [{ "bar": "baz" }] }]', [{ foo: [{ bar: "baz" }] }]);
    shouldNotParse('{ "foo": [{ "bar": "baz" },] }');
    shouldParse('[{ "foo": [{ "bar": "baz" }] }, 1, {}, null]', [{ foo: [{ bar: "baz" }] }, 1, {}, null]);
    shouldNotParse('{ "foo": "bar", }');
    shouldNotParse("{ , }");
    shouldNotParse("{ foo: bar }");
    shouldNotParse("{ : bar }");
    shouldNotParse("{ bar }");
    shouldNotParse("{ : }");
});
