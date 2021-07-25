import { reducing } from "./reducing.fn";

describe("reducing: and-combined-value-criteria", () => {
    describe("full reduction", () => {
        reducing("([2, 3] & is-even)").by("[1, 7]").is(true);
    });

    describe("partial reduction", () => {
        reducing("([3, 10] & is-even)").by("[1, 7]").is("((7, 10] & is-even)");
        reducing("[1, 7]").by("([3, 5] & is-even)").is("(([1, 3) | (5, 7]) | ([3, 5] & is-odd))");
        reducing("[1, 7]").by("(is-even & [3, 5])").is("(([1, 3) | (5, 7]) | ([3, 5] & is-odd))");

        xit("[4, 8] reduced by ([1, 7] & [5, 12]) should be ((7, 8] | [4, 5))", () => {
            // [todo] doesn't work yet, revisit
            //reducing("[4, 8]").by("([1, 7] & [5, 12])").is("((7, 8] | [4, 5))");
        });

        xit("starts-with(foo) reduced by (starts-with(foo) & contains(bar) & ends-with(baz)) should be (starts-with(foo) & !(contains(bar) & ends-with(baz))) ", () => {
            // [todo] string-fn criteria not yet implemented
        });
    });

    describe("no reduction", () => {
        reducing("({5} & [8, 10])").by("[1, 7]").is(false);
    });
});
