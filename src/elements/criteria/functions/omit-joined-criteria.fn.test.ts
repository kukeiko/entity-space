import { describe, expect, it } from "vitest";
import { EntitySchemaCatalog } from "../../entity/entity-schema-catalog";
import { Artist, ArtistBlueprint } from "../../testing";
import { EntityCriterion, PackedEntityCriterion } from "../entity-criterion";
import { omitJoinedCriteria } from "./omit-joined-criteria.fn";

describe(omitJoinedCriteria, () => {
    it("should remove criteria that cross joined relationship boundaries", () => {
        // arrange
        const schema = new EntitySchemaCatalog().getSchemaByBlueprint(ArtistBlueprint);
        const artistCriterion = new EntityCriterion({
            id: 7,
            songs: { duration: 10 },
            metadata: { createdById: 64, createdBy: { name: "Susi" } },
        } satisfies PackedEntityCriterion<Artist>);
        const expected = new EntityCriterion({
            id: 7,
            metadata: { createdById: 64 },
        } satisfies PackedEntityCriterion<Artist>);

        // act
        const omitted = omitJoinedCriteria(artistCriterion, schema);

        // assert
        expect(omitted).toStrictEqual(expected);
    });

    it("should return undefined if nothing is left over", () => {
        // arrange
        const schema = new EntitySchemaCatalog().getSchemaByBlueprint(ArtistBlueprint);
        const artistCriterion = new EntityCriterion({
            songs: { duration: 10 },
            metadata: { createdBy: { name: "Susi" } },
        } satisfies PackedEntityCriterion<Artist>);

        // act
        const omitted = omitJoinedCriteria(artistCriterion, schema);

        // assert
        expect(omitted).toBeUndefined();
    });
});
