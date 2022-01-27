import { orTemplate } from "../lib/criterion/or/or-template.fn";
import { inRange } from "../lib/criterion/range/in-range.fn";
import { isValueTemplate } from "../lib/criterion/value/is-value-template.fn";

describe("playground: criteria", () => {
    it("foo", () => {
        const criterion = inRange(1, 7);
        // const template = orTemplate([isValueTemplate([Number]), notValueTemplate([Boolean, Null, String])]);
        const template = orTemplate([isValueTemplate([Number])]);
        const actual = criterion.remap([template]);

        if (actual[0] !== false) {
            const foo = actual[0][0].getItems()[0].getValue();
        }
    });
});
