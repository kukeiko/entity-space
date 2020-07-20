// import { Query } from "src/query";

// describe("prototyping-playground", () => {
//     /**
//      * Our custom user data type.
//      */
//     class TreeNode {
//         id: number = 0;
//         name?: string;
//         children?: TreeNode[];
//         parent?: TreeNode | null;
//         parents?: TreeNode[];
//         metadata?: Metadata;
//     }

//     class TreeNodeParents {
//         childId: number = 0;
//         parents: TreeNode[] = [];
//     }

//     class Metadata {
//         createdAt: string = "";
//         createdBy?: User;
//         updated: string | null = null;
//         updatedBy?: User | null;
//     }

//     class User {
//         id: number = 0;
//         name?: string = "";
//     }

//     it("query classes (again again)", () => {
//         class TreeNodeQueryOptions {
//             hasChildren?: boolean;

//             reduce(other: this) {
//                 if (this === other) {
//                     return null;
//                 } else if (this.hasChildren === void 0 && other.hasChildren !== void 0) {
//                     return null;
//                 } else if (this.hasChildren === other.hasChildren) {
//                     return null;
//                 } else {
//                     return other;
//                 }
//             }
//         }

//         class TreeNodeQuery extends Query<TreeNode> {
//             getModel() {
//                 return TreeNode;
//             }

//             reduce(other: Query<TreeNode>): Query.Reduction<TreeNode> {
//                 return [new TreeNodeQuery()];
//             }
//         }

//         class TreeNodeParentsQuery extends Query<TreeNodeParents> {
//             getModel() {
//                 return TreeNodeParents;
//             }
//         }

//         // const foo = new TreeNodeQuery({ options: {} })
//         const foo = new TreeNodeQuery()
//             // .configure({ hasChildren: true })
//             .select(x =>
//                 x
//                     .children(x => x.children(x => x.children(x => x.children(x => x.parent().name()))))
//                     .name()
//                     .parent()
//             )
//             .where([{ id: [{ op: "==", value: 1 }] }]);

//         foo.reduce(new TreeNodeQuery());
//     });
// });
