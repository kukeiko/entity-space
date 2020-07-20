// import { of } from "rxjs";
// import { Workspace } from "src/obsolete-but-keep-for-reference/before-using-classes/workspace";
// import { Model } from "src/obsolete-but-keep-for-reference/model";
// import { TreeNode } from "test/facade/model";
// import { QueryTranslator } from "src/obsolete-but-keep-for-reference/before-using-classes/query-translator";
// import { Query } from "src/obsolete-but-keep-for-reference/before-using-classes/query";
// import { QueryStream } from "src/obsolete-but-keep-for-reference/before-using-classes/query-stream";
// import { TreeNodeRepository } from "test/facade/repositories";
// import { Reducible } from "src/obsolete-but-keep-for-reference/before-using-classes/reducible";
// import { QueryResultPacket } from "src/obsolete-but-keep-for-reference/before-using-classes/query-result-packet";
// import { ObjectHydrator } from "src/obsolete-but-keep-for-reference/before-using-classes/object-hydrator";
// import { ObjectHydration } from "src/obsolete-but-keep-for-reference/before-using-classes/object-hydration";
// import { HydratableQueryResult } from "src/obsolete-but-keep-for-reference/before-using-classes/hydratable-query-result";
// import { TestCatalog } from "test/facade/test-catalog";

// describe("core-loading-mechanism", () => {
//     it("translator", () => {
//         const treeNodeModel: Model.Object<TreeNode> = {
//             class: () => TreeNode,
//             type: "object",
//         };

//         const args: Reducible = {
//             reduce(other: Reducible) {
//                 return other;
//             },
//         };

//         type TreeNodeQuery = Query<typeof treeNodeModel, "default">;

//         class TreeNodeQueryTranslator implements QueryTranslator, ObjectHydrator {
//             constructor(private readonly _catalog: TestCatalog, private readonly _repository: TreeNodeRepository) {}

//             translate(query: Query): QueryStream[] {
//                 const streams: QueryStream[] = [];

//                 if (Query.is<TreeNodeQuery>(query, treeNodeModel, "default")) {
//                     if (query.criteria !== void 0) {
//                         for (const criteria of query.criteria) {
//                             if (criteria.id !== void 0) {
//                                 for (const idCriterion of criteria.id) {
//                                     if (idCriterion.op == "==" && typeof idCriterion.value === "number") {
//                                         streams.push(this._byIdStream(idCriterion.value));
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 }

//                 return streams;
//             }

//             hydrate(hydratable: HydratableQueryResult): ObjectHydration[] {
//                 const hydrations: ObjectHydration[] = [];
//                 // const planner =
//                 if (HydratableQueryResult.is<TreeNodeQuery>(hydratable, treeNodeModel, "default")) {
//                     if (hydratable.selected.parent) {
//                         // const load = this._catalog.beginTreeNodeParentsQuery().arguments()
//                         // hydrations.push({
//                         //     load: {
//                         //         arguments: args,
//                         //         model: treeNodeModel,
//                         //         scope: ""
//                         //     }
//                         // })
//                     }
//                 }

//                 return hydrations;
//             }

//             private _byIdStream(id: number): QueryStream<TreeNodeQuery> {
//                 const loadItem = () => this._repository.get(id);
//                 const target = this._catalog
//                     .beginTreeNodeQuery()
//                     .where([{ id: [{ op: "==", value: id }] }])
//                     .build();

//                 return {
//                     target,
//                     open$() {
//                         const item = loadItem();
//                         const payload: Query.Payload<TreeNodeQuery> = [];

//                         const packet: QueryResultPacket<TreeNodeQuery> = {
//                             loaded: target,
//                             payload,
//                             failed: [],
//                             open: [],
//                         };

//                         if (item !== void 0) {
//                             payload.push(item);
//                         }

//                         return of(packet);
//                     },
//                 };
//             }
//         }

//         const workspace = new Workspace();
//         workspace.setTranslator(treeNodeModel, new TreeNodeQueryTranslator(new TestCatalog(), new TreeNodeRepository()));
//     });
// });
