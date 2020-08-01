import { finalize } from "rxjs/operators";
import { TypedCriteria, Workspace, ComponentProvider, Class, Query, TypedInstance, createAlwaysReducible, TypedSelector } from "src";
import { TreeNodeQuery, TreeNodeLevelQuery, TreeNodeParentsQuery, TreeNodeModel, ShapeQuery, TreeNodeParentsModel, Shape, allShapeModels } from "../facade/model";
import {
    TreeNodePayloadHydrator,
    TreeNodeQueryTranslator,
    TreeNodeLevelQueryTranslator,
    TreeNodeParentsQueryTranslator,
    ShapeQueryTranslator,
    TreeNodeParentsHydrator,
} from "../facade/components";
import { TreeNodeRepository, ShapeRepository } from "../facade/data";

/**
 * This spec showcases the core mechanism of how data is loaded.
 *
 * We have some custom models that describe the shape of data loaded and some components that tell entity-space:
 * 1) how initial data set is loaded
 * 2) how that data set is hydrated
 *
 * We have tree nodes to demonstrate how to deal with data that is self referential.
 * We also have canvases & shapes to demonstrate how to deal with data that is based on inheritance.
 */
describe("core-loading-mechanism", () => {
    it("loading some data", done => {
        /**
         * Our repository for tree nodes that resembles the actual API contacted.
         */
        const repository = new TreeNodeRepository();

        /**
         * The components that tell entity-space how to load & hydrate our tree nodes.
         */
        const provider: ComponentProvider = {
            /**
             * Returns the component responsible for loading the initial data set.
             */
            getTranslator(query: Query) {
                if (query instanceof TreeNodeQuery) {
                    return new TreeNodeQueryTranslator(repository);
                } else if (query instanceof TreeNodeParentsQuery) {
                    return new TreeNodeParentsQueryTranslator(repository);
                } else if (query instanceof TreeNodeLevelQuery) {
                    return new TreeNodeLevelQueryTranslator(repository);
                }

                throw new Error(`no translator for query models ${query.model.map(m => m.name).join(", ")} found`);
            },
            /**
             * Returns the component responsible for hydrating a data set.
             */
            getHydrator(model: Class) {
                if (model === TreeNodeModel) {
                    return new TreeNodePayloadHydrator();
                } else if (model === TreeNodeParentsModel) {
                    return new TreeNodeParentsHydrator(new TreeNodePayloadHydrator());
                }

                throw new Error(`no hydrator for class ${model.name} found`);
            },
        };

        /**
         * The thingy against which we issue data loading queries.
         */
        const workspace = new Workspace(provider);

        /**
         * Picking some ids from generated tree nodes to use in a data loading query.
         */
        const someIds = repository
            .all()
            .slice(0, 7)
            .map(x => x.id);

        /**
         * The criteria the data set loaded by our query has to meet.
         */
        const criteria: TypedCriteria<TreeNodeModel> = [
            {
                id: [{ op: "in", values: new Set(someIds) }],
            },
        ];

        /**
         * Optional parts we want to load.
         */
        const selection = new TypedSelector([TreeNodeModel])
            .select(
                x => x.parents,
                x => x.select(x => x.level)
            )
            .select(x => x.level)
            .get();

        /**
         * The actual query containing our criteria & selection, as well as some custom options.
         */
        const query = new TreeNodeQuery({ criteria, selection, options: new TreeNodeQuery.Options({ numMinParents: 1 }) });

        /**
         * Executing the query and expecting the returned data to have some data hydrated.
         *
         * [todo] returned data is not guaranteed to be hydrated, as the workspace eagerly emits unhydrated data the first few times.
         */
        workspace
            .load$<TypedInstance.Selected<TreeNodeModel, typeof query["selection"]>>(query)
            .pipe(finalize(done))
            .subscribe(
                treeNodes => {
                    console.log(treeNodes);

                    if (treeNodes.length > 0) {
                        const treeNode = treeNodes[0];

                        // parents are not undefined since we selected them
                        const parents = treeNodes[0].parents;

                        if (parents.length > 0) {
                            // level is not undefined since we selected it
                            const level = parents[0].level;
                        }
                    }
                },
                error => fail(error)
            );
    });

    it("loading some union data", done => {
        const repository = new ShapeRepository();

        const provider: ComponentProvider = {
            getHydrator(model: Class) {
                return {
                    hydrate(foo: any) {
                        return [];
                    },
                };
                // throw new Error(`no hydrator for class ${model.name} found`);
            },
            getTranslator(query: Query) {
                if (query instanceof ShapeQuery) {
                    return new ShapeQueryTranslator(repository);
                }

                throw new Error(`no hydrator for query models ${query.model.map(m => m.name).join(", ")} found`);
            },
        };

        const workspace = new Workspace(provider);
        const selection = new TypedSelector(allShapeModels)
            .select(x => x.radius)
            .select(
                x => x.shapes,
                x => x.select(x => x.radius)
            )
            .get();

        const query = new ShapeQuery({ selection, options: createAlwaysReducible() });

        workspace
            .load$<TypedInstance.Selected<Shape, typeof query["selection"]>>(query)
            .pipe(finalize(done))
            .subscribe(
                shapes => {
                    console.log("shapes:", shapes);

                    for (const shape of shapes) {
                        switch (shape.type) {
                            case "circle":
                                console.log("circle radius", shape.radius);
                                break;

                            case "square":
                                console.log("square length", shape.length);
                                break;

                            case "triangle":
                                console.log("triangle angles", [shape.angleA, shape.angleB, shape.angleC]);
                                break;

                            case "group":
                                for (const groupedShape of shape.shapes) {
                                    switch (groupedShape.type) {
                                        case "circle":
                                            console.log("grouped shape circle radius", groupedShape.radius);
                                            break;
                                    }
                                }
                                break;
                        }
                    }
                },
                error => fail(error)
            );
    });
});
