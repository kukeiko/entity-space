import { toPaths } from "@entity-space/utils";
import { describe, expect, it } from "vitest";
import { ContainerType } from "./entity-property.mjs";
import { EntityRelationProperty, RelationshipType } from "./entity-relation-property.mjs";
import { EntitySchema } from "./entity-schema.mjs";

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
            expect(addPrimitive).toThrow("primitive bar already exists");
        });

        it("should throw if a relation of that name already exists", () => {
            // arrange
            const foo = new EntitySchema("foo");
            const bar = new EntitySchema("bar");
            foo.addRelation("bar", bar);
            const addPrimitive = () => foo.addPrimitive("bar", String);

            // act & assert
            expect(addPrimitive).toThrow("bar already exists as a relation");
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
            expect(getPrimitive).toThrow("property bar does not exist");
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
            expect(addRelation).toThrow("relation bar already exists");
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

        describe("should throw when using a join path that crosses or points to a container property", () => {
            describe("joinFrom", () => {
                it("container is a primitive", () => {
                    // arrange
                    const foo = new EntitySchema("foo").addPrimitive("barId", Number, {
                        container: ContainerType.Array,
                    });
                    const bar = new EntitySchema("bar");

                    const addRelation = () =>
                        foo.addRelation("bar", bar, {
                            relationshipType: RelationshipType.Joined,
                            joinFrom: toPaths(["barId"]),
                        });

                    // act & assert
                    expect(addRelation).toThrow("expected primitive foo.barId to not be a container");
                });

                it("container is a relation", () => {
                    // arrange
                    const foo = new EntitySchema("foo");
                    const bar = new EntitySchema("bar");
                    const baz = new EntitySchema("baz");

                    foo.addRelation("bar", bar, { container: ContainerType.Array });
                    const addRelation = () =>
                        foo.addRelation("baz", baz, {
                            relationshipType: RelationshipType.Joined,
                            joinFrom: toPaths(["bar.bazId"]),
                        });

                    // act & assert
                    expect(addRelation).toThrow("expected relation foo.bar to not be a container");
                });

                it("container is a primitive of a relation", () => {
                    // arrange
                    const foo = new EntitySchema("foo");
                    const bar = new EntitySchema("bar").addPrimitive("bazId", Number, {
                        container: ContainerType.Array,
                    });
                    const baz = new EntitySchema("baz");

                    foo.addRelation("bar", bar);
                    const addRelation = () =>
                        foo.addRelation("baz", baz, {
                            relationshipType: RelationshipType.Joined,
                            joinFrom: toPaths(["bar.bazId"]),
                        });

                    // act & assert
                    expect(addRelation).toThrow("expected primitive bar.bazId to not be a container");
                });
            });

            describe("joinTo", () => {
                it("container is a primitive", () => {
                    // arrange
                    const foo = new EntitySchema("foo");
                    const bar = new EntitySchema("bar").addPrimitive("id", Number, {
                        container: ContainerType.Array,
                    });

                    const addRelation = () =>
                        foo.addRelation("bar", bar, {
                            relationshipType: RelationshipType.Joined,
                            joinTo: toPaths(["id"]),
                        });

                    // act & assert
                    expect(addRelation).toThrow("expected primitive bar.id to not be a container");
                });

                it("container is a relation", () => {
                    // arrange
                    const foo = new EntitySchema("foo");
                    const bar = new EntitySchema("bar");
                    const baz = new EntitySchema("baz");

                    bar.addRelation("baz", baz, { container: ContainerType.Array });

                    const addRelation = () =>
                        foo.addRelation("bar", bar, {
                            relationshipType: RelationshipType.Joined,
                            joinTo: toPaths(["baz.id"]),
                        });

                    // act & assert
                    expect(addRelation).toThrow("expected relation bar.baz to not be a container");
                });

                it("container is a primitive of a relation", () => {
                    // arrange
                    const foo = new EntitySchema("foo");
                    const bar = new EntitySchema("bar");
                    const baz = new EntitySchema("baz").addPrimitive("id", Number, {
                        container: ContainerType.Array,
                    });

                    bar.addRelation("baz", baz);

                    const addRelation = () =>
                        foo.addRelation("bar", bar, {
                            relationshipType: RelationshipType.Joined,
                            joinTo: toPaths(["baz.id"]),
                        });

                    // act & assert
                    expect(addRelation).toThrow("expected primitive baz.id to not be a container");
                });
            });
        });
    });

    describe(EntitySchema.prototype.getRelation, () => {
        it("should throw if property doesn't exist", () => {
            // arrange
            const schema = new EntitySchema("foo");
            const getRelation = () => schema.getRelation("bar");

            // act & assert
            expect(getRelation).toThrow("property bar does not exist");
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
