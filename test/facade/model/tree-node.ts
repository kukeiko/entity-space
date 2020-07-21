import { Property } from "src/advanced/property";
import { User } from "./user";

export class TreeNode {
    id = Property.create("id", Number, b => b.loadable());
    children = Property.create("children", TreeNode, b => b.loadable(["optional"]).iterable());
    createdBy = Property.create("createdBy", User, b => b.loadable(["optional"]));
    name = Property.create("name", String, b => b.loadable().creatable().patchable());
    parentId = Property.create("parentId", Number, b => b.loadable(["nullable"]).creatable());
    parent = Property.create("parent", TreeNode, b => b.loadable(["nullable", "optional"]).identifiedBy(this.parentId));
    // parentIds?: number[];
    parents = Property.create("parents", TreeNode, b => b.loadable(["optional"]).iterable());
    // metadata?: Metadata;
    level = Property.create("level", Number, b => b.loadable(["optional"]));
    updatedBy = Property.create("createdBy", User, b => b.loadable(["optional", "nullable"]));
}
