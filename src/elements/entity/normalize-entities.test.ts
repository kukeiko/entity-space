import { toPaths } from "@entity-space/utils";
import { describe, expect, it } from "vitest";
import { ContainerType } from "./entity-property";
import { RelationshipType } from "./entity-relation-property";
import { EntitySchema } from "./entity-schema";
import { normalizeEntities } from "./normalize-entities.fn";

describe(normalizeEntities.name, () => {
    it("should normalize entities that are not embedded for all types of containers", () => {
        // arrange
        const rootSchema = new EntitySchema("root").addPrimitive("number", Number);
        const joinedSchema = new EntitySchema("joined").addPrimitive("number", Number).setId(toPaths(["number"]));
        rootSchema.addRelation("joined", joinedSchema, {
            relationshipType: RelationshipType.Joined,
            container: ContainerType.Array,
            joinFrom: toPaths(["number"]),
            joinTo: toPaths(["number"]),
        });
        const embeddedSchema = new EntitySchema("embedded").addPrimitive("number", Number);
        rootSchema.addRelation("embedded", embeddedSchema);
        embeddedSchema.addRelation("joined", joinedSchema, {
            relationshipType: RelationshipType.Joined,
            joinFrom: toPaths(["number"]),
            joinTo: toPaths(["number"]),
        });

        interface Root {
            number: number;
            embedded: Embedded;
            joined: Joined[];
        }

        interface Embedded {
            number: number;
            joined: Joined;
        }

        interface Joined {
            number: number;
        }

        const embeddedJoined: Joined = { number: 20 };
        const embedded: Embedded = { number: 2, joined: embeddedJoined };
        const joined: Joined[] = [{ number: 3 }, { number: 30 }];

        const roots: Root[] = [
            {
                number: 1,
                embedded,
                joined,
            },
        ];

        // act
        const normalized = normalizeEntities(rootSchema, roots);

        // assert
        expect(normalized.get(embeddedSchema)).toBeUndefined();
        expect(normalized.get(joinedSchema)).same.members([embeddedJoined, ...joined]);
        expect(roots[0].embedded).toBeDefined();
        expect(roots[0].embedded.joined).toBeUndefined();
        expect(roots[0].joined).toBeUndefined();
    });

    it("should not throw if related entity is null", () => {
        // arrange
        const fooSchema = new EntitySchema("foo").addPrimitive("id", Number);
        const barSchema = new EntitySchema("bar")
            .addPrimitive("id", Number)
            .setId(toPaths(["id"]))
            .addPrimitive("fooId", Number);
        fooSchema.addRelation("bar", barSchema, {
            relationshipType: RelationshipType.Joined,
            container: ContainerType.Array,
            joinFrom: toPaths(["id"]),
            joinTo: toPaths(["fooId"]),
        });
        const foo = { bar: null };
        const normalize = () => normalizeEntities(fooSchema, [foo]);

        // act & assert
        expect(normalize).not.toThrow();
    });

    it("should throw if an array was expected", () => {
        // arrange
        const fooSchema = new EntitySchema("foo").addPrimitive("id", Number);
        const barSchema = new EntitySchema("bar")
            .addPrimitive("id", Number)
            .setId(toPaths(["id"]))
            .addPrimitive("fooId", Number);
        fooSchema.addRelation("bar", barSchema, {
            relationshipType: RelationshipType.Joined,
            container: ContainerType.Array,
            joinFrom: toPaths(["id"]),
            joinTo: toPaths(["fooId"]),
        });
        const foo = { bar: { baz: 3 } };
        const normalize = () => normalizeEntities(fooSchema, [foo]);

        // act & assert
        expect(normalize).toThrowError("expected property bar to be an array, got object");
    });

    it("should throw if an object was expected, but got a number", () => {
        // arrange
        const fooSchema = new EntitySchema("foo").addPrimitive("id", Number);
        const barSchema = new EntitySchema("bar")
            .addPrimitive("id", Number)
            .setId(toPaths(["id"]))
            .addPrimitive("fooId", Number);
        fooSchema.addRelation("bar", barSchema, {
            relationshipType: RelationshipType.Joined,
            joinFrom: toPaths(["id"]),
            joinTo: toPaths(["fooId"]),
        });
        const foo = { bar: 3 };
        const normalize = () => normalizeEntities(fooSchema, [foo]);

        // act & assert
        expect(normalize).toThrowError("expected property bar to be an object, got number");
    });
});
