import { ExpansionValue } from "@entity-space/common";
import { EntitySchema, Query, reduceQueries } from "@entity-space/core";
import { Criterion } from "@entity-space/criteria";

// [todo] add more tests
describe("reduceQueries()", () => {
    function createQuery(criteria: Criterion, expansion: ExpansionValue = {}): Query {
        return new Query(new EntitySchema("foo"), criteria, expansion);
    }

    describe("no reduction", () => {
        it("[] reduced by [] should be []", () => {
            // arrange
            const a: Query[] = [];
            const b: Query[] = [];

            // act
            const reduced = reduceQueries(a, b);

            // assert
            expect(reduced).toEqual([]);
        });
    });
});
