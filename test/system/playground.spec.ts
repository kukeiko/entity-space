import {
    InNumberSetCriterion,
    InNumberRangeCriterion,
    InStringRangeCriterion,
    CriterionTemplate,
    InstancedCriterionTemplate,
    OrCriteriaTemplate,
    AndCriteriaTemplate,
    NamedCriteriaTemplate,
} from "src";

const inNumberSet = new InNumberSetCriterion([1, 2, 3]);
const inNumberRange = new InStringRangeCriterion(["1", "3"]);

const reduced = inNumberSet.reduce(inNumberRange);
const reducedSet = inNumberSet.reduce(inNumberSet);
const reducedRange = inNumberRange.reduce(inNumberRange);

// credit to captain-yossarian https://captain-yossarian.medium.com/typescript-object-oriented-typings-4fd42ce14c75
// function Mixin<T extends ClassType, R extends T[]>(...classRefs: [...R]): new (...args: any[]) => UnionToIntersection<InstanceType<[...R][number]>> {
//     return merge(class {}, ...classRefs);
// }

describe("prototyping-playground", () => {
    xit("screwing around with criterion templates", () => {
        function instantiateTemplate<T extends CriterionTemplate>(template: T): InstancedCriterionTemplate<T> {
            return {} as any;
        }

        const instanced_or_inNumberRange = instantiateTemplate(new OrCriteriaTemplate([InNumberRangeCriterion]));
        instanced_or_inNumberRange.getItems()[0];

        const instanced_or_inNumberRange_inNumberSet = instantiateTemplate(
            new OrCriteriaTemplate([InNumberRangeCriterion, InNumberSetCriterion, new AndCriteriaTemplate([InStringRangeCriterion])])
        );
        const item_B = instanced_or_inNumberRange_inNumberSet.getItems()[0];
        const instanced_or_propertyCriteria = instantiateTemplate(
            new NamedCriteriaTemplate({ foo: [InNumberRangeCriterion, new OrCriteriaTemplate([InNumberRangeCriterion])], bar: [InNumberSetCriterion, InNumberRangeCriterion] })
        );

        const foo = instanced_or_propertyCriteria.getBag().foo;
        const bar = instanced_or_propertyCriteria.getBag().bar;
        const instanced_deepMix = instantiateTemplate(
            new OrCriteriaTemplate([new NamedCriteriaTemplate({ foo: [InNumberRangeCriterion, new OrCriteriaTemplate([InNumberRangeCriterion])] })])
        );

        instanced_deepMix.getItems()[0].getBag().foo;
    });
});
