import { EntityCriteriaTools } from "../lib/criteria/entity-criteria-tools";
import { EntityStore } from "../lib/entity/store/entity-store";
import { EntitySchema } from "../lib/schema/entity-schema";

interface Vector {
    x: number;
    y: number;
    z: number;
}

describe("InMemoryEntityDatabase", () => {
    const criteriaTools = new EntityCriteriaTools();
    const { where } = criteriaTools;

    it("should work", () => {
        // arrange
        // act
        // assert
    });
});
