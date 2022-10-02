import { ExpansionValue } from "@entity-space/common";
import { Criterion, inSet, matches } from "@entity-space/criteria";
import { Query } from "../../lib/query/query";
import { reduceQueries } from "../../lib/query/reduce-queries.fn";
import { EntitySchema } from "../../lib/schema/entity-schema";

describe("reduceQueries()", () => {
    function createQuery(criteria: Criterion, expansion: ExpansionValue = {}): Query {
        return new Query(new EntitySchema("foo"), criteria, expansion);
    }

    describe("no reduction", () => {
        it("[] reduced by [] should be []", () => {
            // arrange
            const a = createQuery(matches({ id: inSet([1, 2]) }), { foo: true });
            const b = createQuery(matches({ id: inSet([1]) }));

            // act
            const reduced = reduceQueries([], []);

            // assert
            expect(reduced).toEqual([]);
        });
    });
});
