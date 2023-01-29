import { subtracting } from "../tools/subtracting.fn";

describe("subtraction: not-value", () => {
    /**
     * A criteria that is a subset of another should always be completely subtracted.
     */
    describe("full subtraction", () => {
        subtracting("!7").by("!7").shouldBe(true);
    });

    /**
     * If there is no intersection, the criteria should be left untouched.
     */
    describe("no subtraction", () => {
        subtracting("!7").by("!3").shouldBe(false);
    });
});
