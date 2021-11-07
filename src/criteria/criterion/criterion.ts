import { CriterionTemplate } from "./criterion-template.types";

export abstract class Criterion {
    invert(): false | Criterion {
        return false;
    }

    // [todo] should return boolean | Criterion if we dont want empty criteria, because then we might also return true
    // reason: merging("(7, ...]").with("[..., 10)").shouldBe("[..., ...]");
    merge(other: Criterion): false | Criterion {
        return false;
    }

    intersect(other: Criterion): false | Criterion {
        return false;
    }

    // ({ foo: [1, 7] } | { foo: [9, 13] }) remapped to { foo: [OrCriteria, [InNumberRangeCriterion]] } should be { foo: [1, 7] | [9, 13] }
    // ({ foo: [1, 7] } | { foo: [9, 13], bar: {1,2,3} }) remapped to { foo: [OrCriteria, [InNumberRangeCriterion]], bar: [InNumberSetCriterion] } should be ({ foo: [1, 7] } | { foo: [9, 13], bar: {1,2,3} })

    // for each template in templates do:
    // - call this.remapOne(template)
    // - store result
    // return best result based on this order:
    // - [Criterion, void 0]
    // - [Criterion, Criterion]
    // - [false, void 0]
    // templates input order should be considered as an additional way to set priority. this way user has more control.
    remap(templates: CriterionTemplate[]): [false, undefined] | [Criterion, Criterion?] {
        const results: ([false, undefined] | [Criterion, Criterion?])[] = [];

        for (const template of templates) {
            const remapOneResult = this.remapOne(template);

            if (remapOneResult[0] !== false && remapOneResult[1] === void 0) {
                return remapOneResult;
            }

            results.push(remapOneResult);
        }

        const firstRemappedMatch = results.find(result => result[0] !== false);

        return firstRemappedMatch ?? [false, void 0];
    }

    remapOne(template: CriterionTemplate): [false, undefined] | [Criterion, Criterion?] {
        return [false, void 0];
    }

    abstract reduce(other: Criterion): boolean | Criterion;
    abstract toString(): string;
}
