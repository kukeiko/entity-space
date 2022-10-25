import { EntitySchema, ExpansionValue } from "@entity-space/common";
import { Criterion } from "@entity-space/criteria";
import { Query } from "../../lib/query/query";
import { reduceQueries } from "../../lib/query/reduce-queries.fn";

// [todo] add more tests
describe("reduceQueries()", () => {
    function createQuery(criteria: Criterion, expansion: ExpansionValue = {}): Query {
        return new Query({ entitySchema: new EntitySchema("foo"), criteria, expansion });
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
