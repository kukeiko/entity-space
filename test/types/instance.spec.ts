import { IsExact } from "conditional-type-checks";
import { Instance } from "src";
import { TreeNodeModel } from "../facade/model";

// $ExpectType true
type RequiredPropertyNotUndefined = IsExact<Instance<TreeNodeModel>["id"], number>;

// $ExpectType true
type OptionalPropertyIsUndefined = IsExact<Instance<TreeNodeModel>["level"], number | undefined>;

// $ExpectType true
type DeeperOptionalPropertyIsUndefined = IsExact<Exclude<Instance<TreeNodeModel>["parent"], undefined | null>["level"], number | undefined>;

// $ExpectType true
type SelectedOptionalBecomesRequired = IsExact<Instance.Selected<TreeNodeModel, { level: true }>["level"], number>;

// $ExpectType true
type DeeperSelectedOptionalBecomesRequired = IsExact<Instance.Selected<TreeNodeModel, { parents: { level: true } }>["parents"][0]["level"], number>;
