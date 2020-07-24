import { createProperty } from "src";
import { DataEntryModel } from "../data-entry.model";

export class TreeNodeModel extends DataEntryModel {
    id = createProperty("id", Number, b => b.loadable());
    children = createProperty("children", TreeNodeModel, b => b.loadable(["optional"]).iterable());
    name = createProperty("name", String, b => b.loadable().creatable().patchable());
    parentId = createProperty("parentId", Number, b => b.loadable(["nullable"]).creatable());
    parent = createProperty("parent", TreeNodeModel, b => b.loadable(["nullable", "optional"]).identifiedBy(this.parentId));
    // parentIds?: number[];
    parents = createProperty("parents", TreeNodeModel, b => b.loadable(["optional"]).iterable());
    level = createProperty("level", Number, b => b.loadable(["optional"]));
}
