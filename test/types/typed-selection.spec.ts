import { Has, IsExact } from "conditional-type-checks";
import { TypedSelection } from "src";
import { TreeNodeModel, Shape } from "../facade/model";

/**
 * A default selection is not just "{}".
 */
// $ExpectType false
type DefaultIsEmpty = IsExact<TypedSelection<TreeNodeModel>, {}>;

/**
 * Only "true" is a valid value when selecting primitives.
 */
// $ExpectType true
type OnlyTrueIsValidForPrimitives = IsExact<TypedSelection<TreeNodeModel>["id"], true | undefined>;

/**
 * A default selection has some properties we expect for a given model.
 * "id" can only be "true", whereas "children" (which is an array of TreeNode) can either be "true" or another selection.
 */
// $ExpectType true
type DefaultHasSomeExpected = Has<TypedSelection<TreeNodeModel>, { id?: true; children?: true | { id?: true } }>;

/**
 * Here we're making sure that a default selection of a union type (Shape, which is Circle | Square | Triangle )
 * has both the common properties (area & canvas) as well as type specific properties (length for Square, radius
 * for Circle, and angleA for Triangle).
 */
// $ExpectType true
type MergesUnions = Has<TypedSelection<Shape>, { area?: true; length?: true; radius?: true; angleA?: true }>;
