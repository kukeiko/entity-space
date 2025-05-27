import { toPaths } from "@entity-space/utils";
import { describe, expect, it } from "vitest";
import { ContainerType } from "./entity-property";
import { EntityRelationProperty, RelationshipType } from "./entity-relation-property";
import { EntitySchema } from "./entity-schema";

describe(EntitySchema, () => {
    describe(EntitySchema.prototype.addPrimitive, () => {
        it("should add a primitive property", () => {
            // arrange
            const foo = new EntitySchema("foo");
            const getPrimitive = () => foo.getPrimitive("bar");

            // act
            foo.addPrimitive("bar", String);

            // assert
            expect(getPrimitive).not.toThrow();
        });

        it("should throw if a primitive of that name already exists", () => {
            // arrange
            const foo = new EntitySchema("foo");
            const addPrimitive = () => foo.addPrimitive("bar", String);
            addPrimitive();

            // act & assert
            expect(addPrimitive).toThrow("primitive foo.bar already exists");
        });

        it("should throw if a relation of that name already exists", () => {
            // arrange
            const foo = new EntitySchema("foo");
            const bar = new EntitySchema("bar");
            foo.addRelation("bar", bar);
            const addPrimitive = () => foo.addPrimitive("bar", String);

            // act & assert
            expect(addPrimitive).toThrow("foo.bar already exists as a relation");
        });

        it("should throw when passing an invalid primitive type", () => {
            // arrange
            const foo = new EntitySchema("foo");
            const addPrimitive = () => foo.addPrimitive("bar", "invalid" as any);

            // act & assert
            expect(addPrimitive).toThrow("invalid is not a Primitive");
        });

        it("should throw when passing an invalid container type", () => {
            // arrange
            const foo = new EntitySchema("foo");
            const addPrimitive = () => foo.addPrimitive("bar", String, { container: "invalid" as any });

            // act & assert
            expect(addPrimitive).toThrow("invalid is not a valid ContainerType");
        });
    });

    describe(EntitySchema.prototype.getPrimitive, () => {
        it("should throw if property doesn't exist", () => {
            // arrange
            const schema = new EntitySchema("foo");
            const getPrimitive = () => schema.getPrimitive("bar");

            // act & assert
            expect(getPrimitive).toThrow("property foo.bar does not exist");
        });

        it("should throw if property is a relation", () => {
            // arrange
            const schema = new EntitySchema("foo");
            schema.addRelation("bar", new EntitySchema("bar"));
            const getPrimitive = () => schema.getPrimitive("bar");

            // act & assert
            expect(getPrimitive).toThrow("bar is not a primitive property");
        });
    });

    describe(EntitySchema.prototype.addRelation, () => {
        it("should add a relation property", () => {
            // arrange
            const foo = new EntitySchema("foo");
            const bar = new EntitySchema("bar");
            const getRelation = () => foo.getRelation("bar");

            // act
            foo.addRelation("bar", bar);

            // assert
            expect(getRelation).not.toThrow();
            expect(getRelation()).instanceOf(EntityRelationProperty);
        });

        it("should add a joined relation property", () => {
            // arrange
            const foo = new EntitySchema("foo").addPrimitive("id", Number);
            const bar = new EntitySchema("bar")
                .addPrimitive("id", Number)
                .setId(toPaths(["id"]))
                .addPrimitive("fooId", Number);
            const getRelation = () => foo.getRelation("bar");

            // act
            foo.addRelation("bar", bar, {
                relationshipType: RelationshipType.Joined,
                joinFrom: toPaths(["id"]),
                joinTo: toPaths(["fooId"]),
            });

            // assert
            expect(getRelation).not.toThrow();
            expect(getRelation()).instanceOf(EntityRelationProperty);

            const relation = getRelation();
            expect(relation.isJoined()).toEqual(true);
            expect(relation.getRelatedSchema()).toBe(bar);
            expect(relation.getJoinFrom()).toEqual(toPaths(["id"]));
            expect(relation.getJoinTo()).toEqual(toPaths(["fooId"]));
        });

        it("should throw if only a joinFrom path was provided", () => {
            // arrange
            const foo = new EntitySchema("foo").addPrimitive("id", Number);
            const bar = new EntitySchema("bar").addPrimitive("id", Number).setId(toPaths(["id"]));
            const addRelation = () =>
                foo.addRelation("bar", bar, { relationshipType: RelationshipType.Joined, joinFrom: toPaths(["id"]) });

            // act & assert
            expect(addRelation).toThrow("joinFrom & joinTo must have the same length");
        });

        it("should throw if only a joinTo path was provided", () => {
            // arrange
            const foo = new EntitySchema("foo");
            const bar = new EntitySchema("bar")
                .addPrimitive("id", Number)
                .setId(toPaths(["id"]))
                .addPrimitive("fooId", Number);
            const addRelation = () =>
                foo.addRelation("bar", bar, { relationshipType: RelationshipType.Joined, joinTo: toPaths(["fooId"]) });

            // act & assert
            expect(addRelation).toThrow("joinFrom & joinTo must have the same length");
        });

        it("should throw if a relation of that name already exists", () => {
            // arrange
            const foo = new EntitySchema("foo");
            const bar = new EntitySchema("bar");
            const addRelation = () => foo.addRelation("bar", bar);
            addRelation();

            // act & assert
            expect(addRelation).toThrow("relation foo.bar already exists");
        });

        it("should throw if a primitive of that name already exists", () => {
            // arrange
            const foo = new EntitySchema("foo");
            const bar = new EntitySchema("bar");
            foo.addPrimitive("bar", String);
            const addRelation = () => foo.addRelation("bar", bar);

            // act & assert
            expect(addRelation).toThrow("bar already exists as a primitive");
        });

        it("should throw when passing an invalid relationship type", () => {
            // arrange
            const foo = new EntitySchema("foo");
            const bar = new EntitySchema("bar");
            const addRelation = () => foo.addRelation("bar", bar, { relationshipType: "invalid" as any });

            // act & assert
            expect(addRelation).toThrow("invalid is not a valid RelationshipType");
        });

        it("should throw if joinFrom and joinTo don't point to the same primitive type", () => {
            // arrange
            const foo = new EntitySchema("foo").addPrimitive("id", Number).setId(toPaths(["id"]));
            const bar = new EntitySchema("bar")
                .addPrimitive("id", Number)
                .setId(toPaths(["id"]))
                .addPrimitive("fooId", String);

            const addRelation = () =>
                foo.addRelation("bar", bar, {
                    relationshipType: RelationshipType.Joined,
                    joinFrom: toPaths(["id"]),
                    joinTo: toPaths(["fooId"]),
                });

            // act & assert
            expect(addRelation).toThrow("incompatible primitive types between join paths");
        });

        describe("should allow last joinFrom path to be a container", () => {
            it("while not crossing a relation", () => {
                // arrange
                const fooSchema = new EntitySchema("foo")
                    .addPrimitive("id", Number)
                    .addPrimitive("namespace", String)
                    .addPrimitive("barIds", Number, { container: ContainerType.Array })
                    .setId(toPaths(["namespace", "id"]));

                const barSchema = new EntitySchema("bar")
                    .addPrimitive("id", Number)
                    .addPrimitive("namespace", String)
                    .setId(toPaths(["id"]));

                const addRelation = () =>
                    fooSchema.addRelation("bar", barSchema, {
                        container: ContainerType.Array,
                        relationshipType: RelationshipType.Joined,
                        joinFrom: toPaths(["namespace", "barIds"]),
                        joinTo: toPaths(["namespace", "id"]),
                    });

                // act & assert
                expect(addRelation).not.toThrow();
                const relation = fooSchema.getRelation("bar");
                expect(relation.getJoinFrom()).toEqual(toPaths(["namespace", "barIds"]));
                expect(relation.getJoinTo()).toEqual(toPaths(["namespace", "id"]));
            });

            it("while crossing a relation", () => {
                // arrange
                const containsBarIdsSchema = new EntitySchema("containsBarIds").addPrimitive("barIds", Number, {
                    container: ContainerType.Array,
                });

                const fooSchema = new EntitySchema("foo")
                    .addPrimitive("id", Number)
                    .addPrimitive("namespace", String)
                    .addRelation("containsBarIds", containsBarIdsSchema)
                    .setId(toPaths(["namespace", "id"]));

                const barSchema = new EntitySchema("bar")
                    .addPrimitive("id", Number)
                    .addPrimitive("namespace", String)
                    .setId(toPaths(["id"]));

                const addRelation = () =>
                    fooSchema.addRelation("bar", barSchema, {
                        container: ContainerType.Array,
                        relationshipType: RelationshipType.Joined,
                        joinFrom: toPaths(["namespace", "containsBarIds.barIds"]),
                        joinTo: toPaths(["namespace", "id"]),
                    });

                // act & assert
                expect(addRelation).not.toThrow();
                const relation = fooSchema.getRelation("bar");
                expect(relation.getJoinFrom()).toEqual(toPaths(["namespace", "containsBarIds.barIds"]));
                expect(relation.getJoinTo()).toEqual(toPaths(["namespace", "id"]));
            });
        });

        describe("should allow last joinTo path to be a container", () => {
            it("while not crossing a relation", () => {
                // arrange
                const fooSchema = new EntitySchema("foo")
                    .addPrimitive("id", Number)
                    .addPrimitive("namespace", String)
                    .setId(toPaths(["namespace", "id"]));

                const barSchema = new EntitySchema("bar")
                    .addPrimitive("id", Number)
                    .addPrimitive("namespace", String)
                    .addPrimitive("fooIds", Number, { container: ContainerType.Array })
                    .setId(toPaths(["id"]));

                const addRelation = () =>
                    fooSchema.addRelation("bars", barSchema, {
                        container: ContainerType.Array,
                        relationshipType: RelationshipType.Joined,
                        joinFrom: toPaths(["namespace", "id"]),
                        joinTo: toPaths(["namespace", "fooIds"]),
                    });

                // act & assert
                expect(addRelation).not.toThrow();
                const relation = fooSchema.getRelation("bars");
                expect(relation.getJoinFrom()).toEqual(toPaths(["namespace", "id"]));
                expect(relation.getJoinTo()).toEqual(toPaths(["namespace", "fooIds"]));
            });

            it("while crossing a relation", () => {
                // arrange
                const fooSchema = new EntitySchema("foo")
                    .addPrimitive("id", Number)
                    .addPrimitive("namespace", String)
                    .setId(toPaths(["namespace", "id"]));

                const containsFooIdsSchema = new EntitySchema("containsFooIds").addPrimitive("fooIds", Number, {
                    container: ContainerType.Array,
                });

                const barSchema = new EntitySchema("bar")
                    .addPrimitive("id", Number)
                    .addPrimitive("namespace", String)
                    .addRelation("containsFooIds", containsFooIdsSchema)
                    .setId(toPaths(["id"]));

                const addRelation = () =>
                    fooSchema.addRelation("bars", barSchema, {
                        container: ContainerType.Array,
                        relationshipType: RelationshipType.Joined,
                        joinFrom: toPaths(["namespace", "id"]),
                        joinTo: toPaths(["namespace", "containsFooIds.fooIds"]),
                    });

                // act & assert
                expect(addRelation).not.toThrow();
                const relation = fooSchema.getRelation("bars");
                expect(relation.getJoinFrom()).toEqual(toPaths(["namespace", "id"]));
                expect(relation.getJoinTo()).toEqual(toPaths(["namespace", "containsFooIds.fooIds"]));
            });
        });

        it("should throw if both last joinFrom & joinTo paths are a container", () => {
            // arrange
            const fooSchema = new EntitySchema("foo")
                .addPrimitive("id", Number)
                .addPrimitive("namespace", String)
                .addPrimitive("barIds", Number, { container: ContainerType.Array })
                .setId(toPaths(["namespace", "id"]));

            const barSchema = new EntitySchema("bar")
                .addPrimitive("id", Number)
                .addPrimitive("namespace", String)
                .addPrimitive("fooIds", Number, { container: ContainerType.Array })
                .setId(toPaths(["id"]));

            const addRelation = () =>
                fooSchema.addRelation("bar", barSchema, {
                    container: ContainerType.Array,
                    relationshipType: RelationshipType.Joined,
                    joinFrom: toPaths(["namespace", "barIds"]),
                    joinTo: toPaths(["namespace", "fooIds"]),
                });

            // act & assert
            expect(addRelation).toThrow("joinFrom & joinTo can't both be a container");
        });

        it("should throw if last joinFrom path is a container but relation is not", () => {
            // arrange
            const fooSchema = new EntitySchema("foo")
                .addPrimitive("id", Number)
                .addPrimitive("namespace", String)
                .addPrimitive("barIds", Number, { container: ContainerType.Array })
                .setId(toPaths(["namespace", "id"]));

            const barSchema = new EntitySchema("bar")
                .addPrimitive("id", Number)
                .addPrimitive("namespace", String)
                .setId(toPaths(["id"]));

            const addRelation = () =>
                fooSchema.addRelation("bar", barSchema, {
                    relationshipType: RelationshipType.Joined,
                    joinFrom: toPaths(["namespace", "barIds"]),
                    joinTo: toPaths(["namespace", "id"]),
                });

            // act & assert
            expect(addRelation).toThrow("joinFrom / joinTo can only cross a container if the relation is a container");
        });

        it("should throw if last joinTo path is a container but relation is not", () => {
            // arrange
            const fooSchema = new EntitySchema("foo")
                .addPrimitive("id", Number)
                .addPrimitive("namespace", String)
                .setId(toPaths(["namespace", "id"]));

            const barSchema = new EntitySchema("bar")
                .addPrimitive("id", Number)
                .addPrimitive("namespace", String)
                .addPrimitive("fooIds", Number, { container: ContainerType.Array })
                .setId(toPaths(["id"]));

            const addRelation = () =>
                fooSchema.addRelation("bar", barSchema, {
                    relationshipType: RelationshipType.Joined,
                    joinFrom: toPaths(["namespace", "id"]),
                    joinTo: toPaths(["namespace", "fooIds"]),
                });

            // act & assert
            expect(addRelation).toThrow("joinFrom / joinTo can only cross a container if the relation is a container");
        });
    });

    describe(EntitySchema.prototype.getRelation, () => {
        it("should throw if property doesn't exist", () => {
            // arrange
            const schema = new EntitySchema("foo");
            const getRelation = () => schema.getRelation("bar");

            // act & assert
            expect(getRelation).toThrow("property foo.bar does not exist");
        });

        it("should throw if property is a primitive", () => {
            // arrange
            const schema = new EntitySchema("foo");
            schema.addPrimitive("bar", String);
            const getRelation = () => schema.getRelation("bar");

            // act & assert
            expect(getRelation).toThrow("bar is not a relation property");
        });
    });

    describe(EntitySchema.prototype.setId, () => {
        it("should allow a property on an embedded relation", () => {
            // arrange
            const fooSchema = new EntitySchema("foo");
            const barSchema = new EntitySchema("bar").addPrimitive("id", Number);
            fooSchema.addRelation("bar", barSchema);

            const setId = () => fooSchema.setId(toPaths(["bar.id"]));

            // act & assert
            expect(setId).not.toThrow();
        });

        it("should throw if property is optional", () => {
            // arrange
            const schema = new EntitySchema("foo");
            schema.addPrimitive("bar", Number, { optional: true });

            const setId = () => schema.setId(toPaths(["bar"]));

            // act & assert
            expect(setId).toThrow("id path foo.bar points to an optional property");
        });

        it("should throw if property is a container", () => {
            // arrange
            const schema = new EntitySchema("foo");
            schema.addPrimitive("bar", Number, { container: ContainerType.Array });

            const setId = () => schema.setId(toPaths(["bar"]));

            // act & assert
            expect(setId).toThrow("expected primitive foo.bar to not be a container");
        });

        it("should throw if a non-embedded relation is crossed", () => {
            // arrange
            const fooSchema = new EntitySchema("foo").addPrimitive("barId", Number);
            const barSchema = new EntitySchema("bar").addPrimitive("id", Number).setId(toPaths(["id"]));
            fooSchema.addRelation("bar", barSchema, {
                relationshipType: RelationshipType.Joined,
                joinFrom: toPaths(["barId"]),
                joinTo: toPaths(["id"]),
            });

            const setId = () => fooSchema.setId(toPaths(["bar.id"]));

            // act & assert
            expect(setId).toThrow("id path foo.bar.id crosses relation boundary foo.bar that is not embedded");
        });

        it("should throw if property crosses an relation that is a container", () => {
            // arrange
            const fooSchema = new EntitySchema("foo").addPrimitive("barId", Number);
            const barSchema = new EntitySchema("bar").addPrimitive("id", Number);
            fooSchema.addRelation("bar", barSchema, { container: ContainerType.Array });

            const setId = () => fooSchema.setId(toPaths(["bar.fooId"]));

            // act & assert
            expect(setId).toThrow("expected relation foo.bar to not be a container");
        });
    });
});
