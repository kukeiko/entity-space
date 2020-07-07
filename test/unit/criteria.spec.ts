import { runValueCriterionCases_Equals, runValueCriterionCases_In, runValueCriterionCases_NotEquals, runValueCriteriaCases } from "./criteria-reduction-cases";
import { runObjectCriterionCases } from "./criteria-reduction-cases/object-criterion.cases";

describe("criteria", () => {
    // [todo] reach a state so that we can rename it to "...should work for *all* cases"
    it("reduction should work for some cases", () => {
        runValueCriterionCases_Equals();
        runValueCriterionCases_NotEquals();
        runValueCriterionCases_In();
        runValueCriteriaCases();
        runObjectCriterionCases();
    });
});
