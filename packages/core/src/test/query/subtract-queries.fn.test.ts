import { EntityCriteriaTools } from "../../lib/criteria/vnext/entity-criteria-tools";
import { EntityQuery } from "../../lib/query/entity-query";
import { EntityQueryTools } from "../../lib/query/entity-query-tools";

// [todo] add more tests
describe("subtractQueries()", () => {
    // function createQuery(criteria: Criterion, selection: UnpackedEntitySelection = {}): EntityQuery {
    //     return new EntityQuery({ entitySchema: new EntitySchema("foo"), criteria, selection });
    // }
    const queryTools = new EntityQueryTools({ criteriaTools: new EntityCriteriaTools() });
    const { subtractQueries } = queryTools;

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
