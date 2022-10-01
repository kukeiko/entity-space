import { Criterion, inSet, matches } from "@entity-space/criteria";
import { ExpansionValue } from "../../expansion";
import { EntitySchema } from "../../schema/entity-schema";
import { Query } from "../query";
import { reduceQueries } from "../reduce-queries.fn";

describe("reduceQueries()", () => {
    function createQuery(criteria: Criterion, expansion: ExpansionValue = {}): Query {
        return new Query(new EntitySchema("foo"), criteria, expansion);
    }

    describe("no reduction", () => {
        // [todo] currently returns "[]" - would've expected it to return "false" instead.
        // for now i duplicated fixed method and suffixed it with "_v2"
        xit("[] reduced by [] should be false", () => {
            // arrange
            const a = createQuery(matches({ id: inSet([1, 2]) }), { foo: true });
            const b = createQuery(matches({ id: inSet([1]) }));

            // act
            const reduced = reduceQueries([], []);

            // assert
            expect(reduced).toEqual(false);
        });
    });
});
