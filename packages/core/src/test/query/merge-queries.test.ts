import { UnpackedEntitySelection } from "../../lib/common/unpacked-entity-selection.type";
import { ICriterion } from "../../lib/criteria/criterion.interface";
import { EntityCriteriaTools } from "../../lib/criteria/entity-criteria-tools";
import { EntityQuery } from "../../lib/query/entity-query";
import { EntityQueryTools } from "../../lib/query/entity-query-tools";
import { IEntityQuery } from "../../lib/query/entity-query.interface";
import { EntitySchema } from "../../lib/schema/entity-schema";
import { EntitySchemaCatalog } from "../../lib/schema/entity-schema-catalog";

function createQuery(criteria: ICriterion, selection: UnpackedEntitySelection = {}): IEntityQuery {
    return new EntityQueryTools({ criteriaTools: new EntityCriteriaTools() }).createQuery({
        entitySchema: new EntitySchema("user"),
        criteria,
        selection,
    });
}

interface Product {
    price: number;
    rating: number;
}

describe("mergeQueries()", () => {
    const criteriaFactory = new EntityCriteriaTools();
    const queryTools = new EntityQueryTools({ criteriaTools: criteriaFactory });
    const { where, inRange, or } = criteriaFactory.toDestructurable();
    const { mergeQueries, mergeQuery, parseQuery } = queryTools;

    it(`
        { price: [100, 200], rating: [3, 5] }
        merged with
        { price: [300, 500], rating: [3, 5] }
        should be
        ({ price: [100, 200], rating: [3, 5] } | { price: [300, 500], rating: [3, 5] })`, () => {
        // arrange
        const a = createQuery(
            where<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 5),
            })
        );

        const b = createQuery(
            where<Product>({
                price: inRange(300, 500),
                rating: inRange(3, 5),
            })
        );

        const expected = [
            createQuery(
                or(
                    where<Product>({
                        price: inRange(100, 200),
                        rating: inRange(3, 5),
                    }),
                    where<Product>({
                        price: inRange(300, 500),
                        rating: inRange(3, 5),
                    })
                )
            ),
        ];

        // act
        const actual = mergeQueries(a, b);

        // assert
        expect(actual.join(",")).toEqual(expected.join(","));
    });

    it(`
        { price: [100, 200], rating: [3, 8] } / { foo }
        merged with
        { price: [100, 200], rating: [3, 8] } / { foo }
        should be
        { price: [100, 200], rating: [3, 8] } / { foo }`, () => {
        // arrange
        const a = createQuery(
            where<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 5),
            }),
            { foo: true }
        );

        const b = createQuery(
            where<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 5),
            }),
            { foo: true }
        );

        const expected = [
            createQuery(
                where<Product>({
                    price: inRange(100, 200),
                    rating: inRange(3, 5),
                }),
                { foo: true }
            ),
        ];

        // act
        const actual = mergeQueries(a, b);

        // assert
        expect(actual.join(",")).toEqual(expected.join(","));
    });

    // [todo] excluded until #144 is done. as a workaround, workspace.ts merges twice.
    it(`merging [
            { price: [100, 200], rating: [3, 5] } / { foo },
            { price: [100, 200], rating: [3, 8] } / { },
            { price: [100, 200], rating: [3, 8] } / { foo }
        ]
        should be
        { price: [100, 200], rating: [3, 8] } / { foo }`, () => {
        // arrange
        const a = createQuery(
            where<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 5),
            }),
            { foo: true }
        );

        const b = createQuery(
            where<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 8),
            }),
            {}
        );

        const c = createQuery(
            where<Product>({
                price: inRange(100, 200),
                rating: inRange(3, 8),
            }),
            { foo: true }
        );

        const expected = [
            createQuery(
                where<Product>({
                    price: inRange(100, 200),
                    rating: inRange(3, 8),
                }),
                { foo: true }
            ),
        ];

        // act
        const actual = mergeQueries(a, b, c);

        // assert
        expect(actual.join(",")).toEqual(expected.join(","));
    });

    it("should merge A, B & C where A can only be merged after B & C have been merged", () => {
        const schemas = new EntitySchemaCatalog();
        const userSchema = new EntitySchema("users");
        userSchema.addRelationProperty("parent", userSchema, "parentId", "id");
        schemas.addSchema(userSchema);

        const A = parseQuery("users({ id: {2, 3}, parent: { id: 7 } })/{ id, parentId }", schemas);
        const B = parseQuery("users({ id: 2, parent: { id: 7 } })/{ id, parentId, parent: { id } }", schemas);
        const C = parseQuery("users({ id: 3, parent: { id: 7 } })/{ id, parentId, parent: { id } }", schemas);
        const expected = parseQuery(
            "users({ id: {2, 3}, parent: { id: 7 } })/{ id, parentId, parent: { id } }",
            schemas
        );

        expect(mergeQuery(A, B)).toBe(false);
        expect(mergeQuery(A, C)).toBe(false);
        const BC = mergeQuery(B, C);
        expect(BC).not.toBe(false);
        expect(BC.toString()).toEqual(expected.toString());

        expect(mergeQuery(A, BC as EntityQuery).toString()).toEqual(expected.toString());

        expect(mergeQueries(A, B, C).toString()).toEqual(expected.toString());
    });
});
