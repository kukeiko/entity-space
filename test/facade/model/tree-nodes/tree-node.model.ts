import { createProperty } from "src";
import { User } from "../user.model";

export class TreeNodeModel {
    id = createProperty("id", Number, b => b.loadable());
    children = createProperty("children", TreeNodeModel, b => b.loadable(["optional"]).iterable());
    createdBy = createProperty("createdBy", User, b => b.loadable(["optional"]));
    name = createProperty("name", String, b => b.loadable().creatable().patchable());
    parentId = createProperty("parentId", Number, b => b.loadable(["nullable"]).creatable());
    parent = createProperty("parent", TreeNodeModel, b => b.loadable(["nullable", "optional"]).identifiedBy(this.parentId));
    // parentIds?: number[];
    parents = createProperty("parents", TreeNodeModel, b => b.loadable(["optional"]).iterable());
    // metadata?: Metadata;
    level = createProperty("level", Number, b => b.loadable(["optional"]));
    updatedBy = createProperty("updatedBy", User, b => b.loadable(["optional", "nullable"]));
}
