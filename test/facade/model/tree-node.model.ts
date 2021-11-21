import { define } from "src";
import { DataEntryModel } from "./data-entry.model";

/**
 * Example of a model that is a tree, i.e. it has its own type as a parent and as children.
 *
 * We support loading all the parents by having a single property that contains them all, which in our
 * case is loaded separately using a TreeNodeParentsQuery.
 */
export class TreeNodeModel extends DataEntryModel {
    id = define(Number, { id: true, required: true, readOnly: true });
    children = define(TreeNodeModel, { array: true, readOnly: true });
    name = define(String);
    parentId = define(Number, { nullable: true, required: true });
    parent = define(TreeNodeModel, { nullable: true });
    parentIds = define(Number, { array: true, readOnly: true });
    parents = define(TreeNodeModel, { array: true, readOnly: true });
    level = define(Number, { readOnly: true });
}
