// import { finalize, takeLast } from "rxjs/operators";
// import {
//     TypedCriteria,
//     Workspace,
//     ComponentProvider,
//     Class,
//     Query,
//     TypedInstance,
//     createAlwaysReducible,
//     TypedSelector,
//     Instance,
//     pickProperties,
//     isPrimitive,
//     Selection,
//     Property,
//     isTypedQuery,
// } from "src";
// import {
//     TreeNodeQuery,
//     TreeNodeLevelQuery,
//     TreeNodeParentsQuery,
//     TreeNodeModel,
//     ShapeQuery,
//     TreeNodeParentsModel,
//     Shape,
//     allShapeModels,
//     TreeNodeLevelModel,
// } from "../facade/model";
// import {
//     TreeNodePayloadHydrator,
//     TreeNodeQueryTranslator,
//     TreeNodeLevelQueryTranslator,
//     TreeNodeParentsQueryTranslator,
//     ShapeQueryTranslator,
//     TreeNodeParentsHydrator,
//     TreeNodeCache,
// } from "../facade/components";
// import { TreeNodeRepository, ShapeRepository } from "../facade/data";

// /**
//  * This spec showcases the core mechanism of how data is loaded.
//  *
//  * We have some custom models that describe the shape of data loaded and some components that tell entity-space:
//  * 1) how initial data set is loaded
//  * 2) how that data set is hydrated
//  *
//  * We have tree nodes to demonstrate how to deal with data that is self referential.
//  * We also have canvases & shapes to demonstrate how to deal with data that is based on inheritance.
//  */
// xdescribe("caching-mechanism", () => {
//     function toInstancesWithPrimitivesOnly(models: Class[], entities: Instance[]): Instance[] {
//         let merged: Record<string, Property> = {};

//         for (const model of models) {
//             merged = { ...merged, ...pickProperties(new model()) };
//         }

//         const cacheables: Instance[] = [];

//         // for (const model of models) {
//         // const metadata = new model();
//         // [todo] type discriminants not included yet
//         //   ^ not sure i remember what i meant by that
//         //   ^ probably that "isPrimitive" doesn't include const strings/numbers (e.g. "type" property on the Shape sample models)

//         // [todo] if i want to use Property.Value.every(), then i need to change typing of Property.Value to e.g.Primitive[] | Class[] | unknown[];
//         const primitives: any = {}; // = Object.entries(pickProperties(merged, p => p.value.every(isPrimitive)));

//         for (const entity of entities) {
//             const cacheable: Instance = {};

//             for (const [key] of primitives) {
//                 cacheable[key] = entity[key];
//             }

//             cacheables.push(cacheable);
//         }
//         // }

//         return cacheables;
//     }

//     function collectSelectedInstances(models: Class[], entities: Instance[], selection: Selection, collected = new Map<Class, Instance[]>()): Map<Class, Instance[]> {
//         return collected;
//     }

//     it("loading some data", done => {
//         /**
//          * Our repository for tree nodes that resembles the actual API contacted.
//          */
//         const repository = new TreeNodeRepository();

//         const cache = new TreeNodeCache();

//         /**
//          * The components that tell entity-space how to load & hydrate our tree nodes.
//          */
//         const provider: ComponentProvider = {
//             /**
//              * Returns the component responsible for loading the initial data set.
//              */
//             // [todo] check against model types instead, just like in core-loading-mechanism.spec
//             getTranslator(query: Query) {
//                 if (isTypedQuery(query, [TreeNodeModel])) {
//                     return new TreeNodeQueryTranslator(repository);
//                 } else if (isTypedQuery(query, [TreeNodeParentsModel])) {
//                     return new TreeNodeParentsQueryTranslator(repository);
//                 } else if (isTypedQuery(query, [TreeNodeLevelModel])) {
//                     return new TreeNodeLevelQueryTranslator(repository);
//                 }

//                 throw new Error(`no translator for query models ${query.model.map(m => m.name).join(", ")} found`);
//             },
//             /**
//              * Returns the component responsible for hydrating a data set.
//              */
//             getHydrator(model: Class) {
//                 if (model === TreeNodeModel) {
//                     return new TreeNodePayloadHydrator();
//                 } else if (model === TreeNodeParentsModel) {
//                     return new TreeNodeParentsHydrator(new TreeNodePayloadHydrator());
//                 }

//                 throw new Error(`no hydrator for class ${model.name} found`);
//             },
//             getCacheReader() {
//                 return cache;
//             },
//             getCacheWriter() {
//                 return cache;
//             },
//         };

//         /**
//          * The thingy against which we issue data loading queries.
//          */
//         const workspace = new Workspace(provider);

//         /**
//          * Picking some ids from generated tree nodes to use in a data loading query.
//          */
//         const someIds = repository
//             .all()
//             .slice(0, 7)
//             .map(x => x.id);

//         /**
//          * The criteria the data set loaded by our query has to meet.
//          */
//         const criteria: TypedCriteria<TreeNodeModel> = [
//             {
//                 id: [{ op: "in", values: new Set(someIds) }],
//             },
//         ];

//         /**
//          * Optional parts we want to load.
//          */
//         const selection = new TypedSelector([TreeNodeModel])
//             // .select(
//             //     x => x.parents,
//             //     x => x.select(x => x.level)
//             // )
//             .select(x => x.level)
//             .get();

//         /**
//          * The actual query containing our criteria & selection, as well as some custom options.
//          */
//         // const query = new TreeNodeQuery({ criteria, selection, options: new TreeNodeQuery.Options({ numMinParents: 1 }) });
//         const query = new TreeNodeQuery({ criteria, selection, options: createAlwaysReducible() });

//         /**
//          * Executing the query and expecting the returned data to have some data hydrated.
//          *
//          * [todo] returned data is not guaranteed to be hydrated, as the workspace eagerly emits unhydrated data the first few times.
//          */
//         workspace
//             .load$<TypedInstance.Selected<TreeNodeModel, typeof query["selection"]>>(query)
//             .pipe(takeLast(1))
//             .subscribe(
//                 treeNodes => {
//                     console.log("load$() result", treeNodes);
//                     workspace
//                         .load$(query)
//                         .pipe(finalize(done))
//                         .subscribe(
//                             loadedAgain => {
//                                 console.log("loaded again", loadedAgain);
//                             },
//                             error => fail(error)
//                         );
//                 },
//                 error => fail(error)
//             );
//     });
// });
