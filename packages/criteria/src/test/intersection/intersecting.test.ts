import { intersecting } from "../tools/intersecting.fn";

describe("intersecting criteria", () => {
    // is-value
    intersecting("true").with("true").shouldBe("true");
    intersecting("true").with("false").shouldBe(false);
    intersecting("1").with("{-1, 0, 1}").shouldBe("1");

    // set
    intersecting("{1, 2, 3}").with("{2}").shouldBe("{2}");
    intersecting("{1, 2, 3}").with("2").shouldBe("2");
    intersecting("{1, 2, 3}").with("{4}").shouldBe(false);

    // not-in-set
    intersecting("!{2}").with("!{7}").shouldBe("!{2, 7}");

    // range
    intersecting("[1, 7]").with("[3, 5]").shouldBe("[3, 5]");
    intersecting("[3, 5]").with("[1, 7]").shouldBe("[3, 5]");
    intersecting("[1, 7]").with("[5, 9]").shouldBe("[5, 7]");
    intersecting("[1, ...]").with("[3, ...]").shouldBe("[3, ...]");
    intersecting("[..., 7]").with("[..., -1]").shouldBe("[..., -1]");
    intersecting("[3, 7]").with("[1, 4]").shouldBe("[3, 4]");
    intersecting("[1, 7]").with("[0, 8]").shouldBe("[1, 7]");
    intersecting("[1, 7]").with("[8, 10]").shouldBe(false);
    intersecting("[1, 7]").with("(3, 5)").shouldBe("(3, 5)");

    // or-criteria
    intersecting("[1, 7] | [10, 13]").with("[3, 9]").shouldBe("[3, 7]");
    intersecting("[1, 7] | [10, 13]").with("[3, 11]").shouldBe("[3, 7] | [10, 11]");
    intersecting("[1, 7] | [10, 13]").with("[3, 11] | [13, 17]").shouldBe("[3, 7] | [10, 11] | [13, 13]");

    // named-criteria
    intersecting("{ foo:{1,2,3} }").with("{ foo:{2} }").shouldBe("{ foo:{2} }");
    intersecting("{ foo:{1,2,3} }").with("{ bar:{2} }").shouldBe("{ foo:{1,2,3}, bar:{2} }");
    intersecting("{ foo:{1,2,3} }").with("{ foo:{4,5,6} }").shouldBe(false);
});
