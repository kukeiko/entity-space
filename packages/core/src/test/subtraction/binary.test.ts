import { subtracting } from "../tools/subtracting.fn";

describe("subtraction: binary", () => {
    describe("full subtraction", () => {
        subtracting("even").by("even").shouldBe(true);
    });
});
