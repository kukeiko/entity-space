import { EntitySchema, ExpansionValue } from "@entity-space/common";
import { Criterion } from "@entity-space/criteria";
import { EntityQuery } from "../../lib/query/entity-query";
import { subtractQueries } from "../../lib/query/subtract-queries.fn";

// [todo] add more tests
describe("reduceQueries()", () => {
    function createQuery(criteria: Criterion, expansion: ExpansionValue = {}): EntityQuery {
        return new EntityQuery({ entitySchema: new EntitySchema("foo"), criteria, expansion });
    }

    describe("no reduction", () => {
        it("[] reduced by [] should be []", () => {
            // arrange
            const a: EntityQuery[] = [];
            const b: EntityQuery[] = [];

            // act
            const reduced = subtractQueries(a, b);

            // assert
            expect(reduced).toEqual([]);
        });
    });
});
