// import { IsExact } from "conditional-type-checks";
// import { TypedInstance } from "src";
// import { TreeNodeModel } from "../facade/model";

// // $ExpectType true
// type RequiredPropertyNotUndefined = IsExact<TypedInstance<TreeNodeModel>["id"], number>;

// // $ExpectType true
// type OptionalPropertyIsUndefined = IsExact<TypedInstance<TreeNodeModel>["level"], number | undefined>;

// // $ExpectType true
// type DeeperOptionalPropertyIsUndefined = IsExact<Exclude<TypedInstance<TreeNodeModel>["parent"], undefined | null>["level"], number | undefined>;

// // $ExpectType true
// type SelectedOptionalBecomesRequired = IsExact<TypedInstance.Selected<TreeNodeModel, { level: true }>["level"], number>;

// // $ExpectType true
// type DeeperSelectedOptionalBecomesRequired = IsExact<TypedInstance.Selected<TreeNodeModel, { parents: { level: true } }>["parents"][0]["level"], number>;
