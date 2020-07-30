import { createProperty } from "src";
import { UserModel } from "./user.model";

/**
 * Example of a model that has data that exists on a lot of types, but is put into a separate model to reduce repetitiveness.
 * As such, it doesn't have an id, and can not exist without the model that references it.
 *
 * It has references to other models, so this showcases how you can have navigations to addressable models within a complex type model.
 *
 * The only way to load this would be to include it in the selection of the respective model query (e.g. when loading TreeNodes,
 * include "metadata" in the selection).
 *
 * Once loaded, and when loaded without "createdBy" or "updatedBy", it can still be hydrated without loading the model it is referenced by,
 * as all we need to load those two properties is the ids of the users, which we have.
 */
export class MetadataModel {
    createdAt = createProperty("createdAt", [String], b => b.loadable());
    createdById = createProperty("createdById", [Number], b => b.loadable());
    createdBy = createProperty("createdBy", [UserModel], b => b.loadable(["optional"]).identifiedBy(this.createdById));
    updatedAt = createProperty("updatedAt", [String], b => b.loadable(["nullable"]));
    updatedById = createProperty("updatedById", [Number], b => b.loadable(["nullable"]));
    updatedBy = createProperty("updatedBy", [UserModel], b => b.loadable(["optional", "nullable"]).identifiedBy(this.updatedById));
}
