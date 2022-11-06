import { EntitySchema, EntitySelectionValue } from "@entity-space/common";
import { Criterion } from "@entity-space/criteria";
import { EntityQuery } from "../../lib/query/entity-query";
import { subtractQueries } from "../../lib/query/subtract-queries.fn";

// [todo] add more tests
describe("subtractQueries()", () => {
    function createQuery(criteria: Criterion, expansion: EntitySelectionValue = {}): EntityQuery {
        return new EntityQuery({ entitySchema: new EntitySchema("foo"), criteria, expansion });
    }

    describe("no subtraction", () => {
        it("[] subtracted by [] should be []", () => {
            // arrange
            const a: EntityQuery[] = [];
            const b: EntityQuery[] = [];

            // act
            const subtracted = subtractQueries(a, b);

            // assert
            expect(subtracted).toEqual([]);
        });
    });
});
