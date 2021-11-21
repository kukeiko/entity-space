// import { TypedInstance, TypedQuery, TypedSelection, TypedSelector } from "../../src";
// import { CanvasModel, CircleModel, SquareModel, TreeNodeModel, TriangleModel } from "../facade/model";

// describe("playground: typed-metadata", () => {
//     const treeNodeCreatable: TypedInstance<TreeNodeModel, "creatable"> = {
//         name: "foo",
//         parentId: 3,
//     };

//     const treeNodePatch: TypedInstance<TreeNodeModel, "patchable"> = {
//         name: "foo",
//     };

//     it("redo select() for moar performance", () => {
//         const selector = new TypedSelector([TreeNodeModel]);
//         const selection = selector
//             .select(
//                 treeNode => treeNode.children,
//                 children =>
//                     children.select(
//                         child => child.parents,
//                         parents => parents.select(parent => parent.level)
//                     )
//             )
//             .select(treeNode => treeNode.metadata)
//             .select(
//                 treeNode => treeNode.children,
//                 children => children.select(child => child.name)
//             )
//             .get();
//     });

//     it("playing w/ unions", () => {
//         class CanvasQuery extends TypedQuery<CanvasModel> {
//             getModel() {
//                 return [CanvasModel];
//             }

//             model = [CanvasModel];
//         }

//         type CanvasQueryDefaultPayload = TypedQuery.Payload<CanvasQuery>;

//         const defaultPayload: CanvasQueryDefaultPayload = [
//             {
//                 id: 1,
//                 name: "foo",
//                 authorId: 8,
//                 shapes: [{ type: "triangle", id: 1 }],
//             },
//         ];

//         const canvasSelection: TypedSelection<CanvasModel> = {
//             author: true,
//             shapes: {
//                 canvas: true,
//                 angleA: true,
//                 area: true,
//                 angleB: true,
//                 length: true,
//             },
//         };

//         // const selection = select([CanvasModel], x => x.author(x => x.name()).shapes(x => x.area().radius().length().canvas().angleA().angleB().angleC()));

//         const selection = new TypedSelector([CanvasModel])
//             // .select(x => x.id)
//             .select(x => x.author)
//             .select(
//                 x => x.shapes
//                 // [todo] selecting the type bricked the models below (property "type" is missing)
//                 // x => x.select(x => x.type).select(x => x.length),
//             )
//             .get();

//         const selectedInstance: TypedInstance.Selected<CanvasModel, typeof selection> = {
//             id: 7,
//             authorId: 3,
//             author: {
//                 id: 3,
//                 name: "susi",
//             },
//             name: "malwand",
//             shapes: [
//                 // {
//                 // }
//                 // { id: 8, type: "square", area: 3, length: 2, canvas: { id: 7, name: "malwand" } },
//                 // { id: 19, type: "circle", area: 9, radius: 123, canvas: { id: 7, name: "malwand" } },
//                 // { id: 21, type: "triangle", area: 13, angleA: 1, angleB: 2, angleC: 3, canvas: { id: 7, name: "malwand" } },
//             ],
//         };
//     });

//     it("union criteria", () => {
//         // const canvasCriteria: TypedCriteria<CanvasModel> = [
//         //     {
//         //         shapes: [
//         //             {
//         //                 angleA: [{ op: ">", value: 3 }],
//         //                 angleB: [{ op: ">", value: 3 }],
//         //                 angleC: [{ op: ">", value: 3 }],
//         //                 area: [{ op: ">", value: 3 }],
//         //                 id: [{ op: ">", value: 3 }],
//         //                 length: [{ op: ">", value: 3 }],
//         //                 radius: [{ op: ">", value: 3 }],
//         //                 canvas: [
//         //                     {
//         //                         shapes: [
//         //                             {
//         //                                 angleA: [{ op: ">", value: 3 }],
//         //                                 angleB: [{ op: ">", value: 3 }],
//         //                                 angleC: [{ op: ">", value: 3 }],
//         //                                 area: [{ op: ">", value: 3 }],
//         //                                 id: [{ op: ">", value: 3 }],
//         //                                 length: [{ op: ">", value: 3 }],
//         //                                 radius: [{ op: ">", value: 3 }],
//         //                             },
//         //                         ],
//         //                     },
//         //                 ],
//         //             },
//         //         ],
//         //     },
//         // ];
//     });

//     it("union as entry type", () => {
//         type ShapeModels = CircleModel | SquareModel | TriangleModel;
//         type UnionQuery = TypedQuery<ShapeModels>;
//         type UnionQueryPayload = TypedQuery.Payload<UnionQuery>;

//         const payload: UnionQueryPayload = [
//             {
//                 type: "triangle",
//                 id: 1,
//                 angleA: 3,
//             },
//         ];

//         class ShapeQuery extends TypedQuery<ShapeModels> {
//             getModel() {
//                 return [CircleModel, SquareModel, TriangleModel];
//             }

//             model = [CircleModel, SquareModel, TriangleModel];
//         }

//         type ShapeQueryPayload = TypedQuery.Payload<ShapeQuery>;

//         const shapeQueryPayload: ShapeQueryPayload = [
//             {
//                 type: "triangle",
//                 id: 1,
//                 angleA: 3,
//             },
//             {
//                 type: "square",
//                 id: 3,
//                 length: 8,
//             },
//         ];

//         // const selection = select([CircleModel, SquareModel, TriangleModel], x => x.canvas(x => x.shapes(x => x.canvas())));

//         // const selectedInstances : Instance.Selected<ShapeModels, typeof selection>[] = [
//         //     {
//         //         canvas: {
//         //             shapes: [{
//         //                 type: "circle",

//         //             }]
//         //         }
//         //     }
//         // ];
//     });

//     it("value types", () => {
//         function Void(): undefined {
//             return void 0;
//         }

//         function Null(): null {
//             return null;
//         }

//         const anySymbol: Symbol = Symbol("any");

//         function Any(): any {
//             return anySymbol;
//         }

//         class ValueType<T extends () => any = () => any> {
//             constructor(constructors: Iterable<T>) {
//                 this.constructors = Array.from(constructors);
//                 this.defaultValues = this.constructors.map(ctor => ctor());
//             }

//             readonly constructors: ReadonlyArray<T>;
//             readonly defaultValues: ReadonlyArray<ReturnType<T>>;

//             static Any(): ValueType {
//                 return new ValueType([Any]);
//             }
//         }

//         type ValueOfValueType<T extends ValueType> = T["defaultValues"][number];
//     });
// });
