// import { Instance, select } from "src";
// import { TreeNodeModel } from "../facade/model";

// xdescribe("performance", () => {
//     it("deep selection", () => {
//         const selection = select(TreeNodeModel, x =>
//             x
//                 .parents()
//                 .metadata(x =>
//                     x.createdBy(x =>
//                         x
//                             .createdThings(x => x.radius())
//                             .metadata(x =>
//                                 x.createdBy(x =>
//                                     x
//                                         .createdThings(x => x.radius())
//                                         .metadata(x =>
//                                             x.createdBy(x =>
//                                                 x
//                                                     .createdThings(x => x.radius())
//                                                     .metadata(x =>
//                                                         x.createdBy(x =>
//                                                             x
//                                                                 .createdThings(x => x.radius())
//                                                                 .metadata(x =>
//                                                                     x.createdBy(x =>
//                                                                         x
//                                                                             .createdThings(x => x.radius())
//                                                                             .metadata(x =>
//                                                                                 x.createdBy(x =>
//                                                                                     x.metadata(x =>
//                                                                                         x.createdBy(x =>
//                                                                                             x.metadata(x =>
//                                                                                                 x.createdBy(x =>
//                                                                                                     x.metadata(x =>
//                                                                                                         x.createdBy(x =>
//                                                                                                             x.metadata(x =>
//                                                                                                                 x.createdBy(x =>
//                                                                                                                     x.metadata(x =>
//                                                                                                                         x.createdBy(x =>
//                                                                                                                             x.metadata(x =>
//                                                                                                                                 x.createdBy(x =>
//                                                                                                                                     x.metadata(x =>
//                                                                                                                                         x.createdBy(x =>
//                                                                                                                                             x.metadata(x =>
//                                                                                                                                                 x.createdBy(x =>
//                                                                                                                                                     x.metadata(x =>
//                                                                                                                                                         x.createdBy(x =>
//                                                                                                                                                             x.metadata(x =>
//                                                                                                                                                                 x.createdBy(x =>
//                                                                                                                                                                     x.metadata(x =>
//                                                                                                                                                                         x.createdBy(
//                                                                                                                                                                             x =>
//                                                                                                                                                                                 x.createdThings()
//                                                                                                                                                                         )
//                                                                                                                                                                     )
//                                                                                                                                                                 )
//                                                                                                                                                             )
//                                                                                                                                                         )
//                                                                                                                                                     )
//                                                                                                                                                 )
//                                                                                                                                             )
//                                                                                                                                         )
//                                                                                                                                     )
//                                                                                                                                 )
//                                                                                                                             )
//                                                                                                                         )
//                                                                                                                     )
//                                                                                                                 )
//                                                                                                             )
//                                                                                                         )
//                                                                                                     )
//                                                                                                 )
//                                                                                             )
//                                                                                         )
//                                                                                     )
//                                                                                 )
//                                                                             )
//                                                                     )
//                                                                 )
//                                                         )
//                                                     )
//                                             )
//                                         )
//                                 )
//                             )
//                     )
//                 )
//         );

//         function acceptsRidiculousEntities(entities: Instance.Selected<TreeNodeModel, typeof selection>[]) {
//             return entities.map(x => x.metadata.createdBy?.metadata?.createdBy?.metadata);
//         }

//         const names = acceptsRidiculousEntities([] as any).map(x => x?.createdBy.name);

//         const instance: Instance.Selected<TreeNodeModel, typeof selection> = {
//             id: 1,
//             name: "foo",
//             parentId: 3,
//             parents: [],
//             metadata: {} as any,
//             // createdBy: {
//             //     // [todo] unions break here because there is no discriminant across all contained types, that's something we need to document
//             //     createdThings: [
//             //         {
//             //             parentId: 3,
//             //             id: 1,
//             //             radius: 3,
//             //         },
//             //     ],
//             //     id: 1,
//             //     metadata: {} as any,
//             //     name: "foo",
//             // },
//         };
//     });
// });
