import { createProperty } from "src";
import { DataEntryModel } from "../data-entry.model";

/**
 * Example of a model that is a tree, i.e. it has its own type as a parent and as children.
 *
 * We support loading all the parents by having a single property that contains them all, which in our
 * case is loaded separately using a TreeNodeParentsQuery.
 */
export class TreeNodeModel extends DataEntryModel {
    id = createProperty("id", [Number], b => b.loadable());
    children = createProperty("children", [TreeNodeModel], b => b.loadable(["optional"]).iterable());
    name = createProperty("name", [String], b => b.loadable().creatable().patchable());
    parentId = createProperty("parentId", [Number], b => b.loadable(["nullable"]).creatable());
    parent = createProperty("parent", [TreeNodeModel], b => b.loadable(["nullable", "optional"]).identifiedBy(this.parentId));
    parentIds = createProperty("parentIds", [Number], b => b.loadable(["optional"]).iterable());
    parents = createProperty("parents", [TreeNodeModel], b => b.loadable(["optional"]).iterable());
    level = createProperty("level", [Number], b => b.loadable(["optional"]));
}
