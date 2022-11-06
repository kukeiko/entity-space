import { subtracting } from "../tools/subtracting.fn";

describe("subtraction: and-criteria", () => {
    describe("full subtraction", () => {
        subtracting("([2, 3] & even)").by("[1, 7]").shouldBe(true);
    });

    describe("partial subtraction", () => {
        subtracting("([3, 10] & even)").by("[1, 7]").shouldBe("((7, 10] & even)");
        subtracting("[1, 7]").by("([3, 5] & even)").shouldBe("(([1, 3) | (5, 7]) | ([3, 5] & odd))");
        subtracting("[1, 7]").by("(even & [3, 5])").shouldBe("(([1, 3) | (5, 7]) | ([3, 5] & odd))");

        xit("[4, 8] subtracted by ([1, 7] & [5, 12]) should be ((7, 8] | [4, 5))", () => {
            // [todo] doesn't work yet, revisit
            //reducing("[4, 8]").by("([1, 7] & [5, 12])").is("((7, 8] | [4, 5))");
        });

        xit("starts-with(foo) subtracted by (starts-with(foo) & contains(bar) & ends-with(baz)) should be (starts-with(foo) & !(contains(bar) & ends-with(baz))) ", () => {
            // [todo] string-fn criteria not yet implemented
        });
    });

    describe("no subtraction", () => {
        subtracting("({5} & [8, 10])").by("[1, 7]").shouldBe(false);
    });
});
