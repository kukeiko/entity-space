import { finalize } from "rxjs/operators";
import { TypedCriteria, Workspace, ComponentProvider, Class, Query, TypedInstance, createAlwaysReducible } from "src";
import { TreeNodeQuery, TreeNodeLevelQuery, TreeNodeParentsQuery, TreeNodeModel, ShapeQuery, TreeNodeParentsModel, Shape } from "../facade/model";
import {
    TreeNodePayloadHydrator,
    TreeNodeQueryTranslator,
    TreeNodeLevelQueryTranslator,
    TreeNodeParentsQueryTranslator,
    ShapeQueryTranslator,
    TreeNodeParentsHydrator,
} from "../facade/components";
import { TreeNodeRepository, ShapeRepository } from "../facade/data";

describe("core-loading-mechanism", () => {
    it("loading some data", done => {
        const repository = new TreeNodeRepository();

        const provider: ComponentProvider = {
            getHydrator(model: Class) {
                if (model === TreeNodeModel) {
                    return new TreeNodePayloadHydrator();
                } else if (model === TreeNodeParentsModel) {
                    return new TreeNodeParentsHydrator(new TreeNodePayloadHydrator());
                }

                throw new Error(`no hydrator for class ${model.name} found`);
            },
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
        };

        const workspace = new Workspace(provider);

        const someIds = repository
            .all()
            .slice(0, 7)
            .map(x => x.id);

        const criteria: TypedCriteria<TreeNodeModel> = [
            {
                id: someIds.map(id => ({ op: "==", value: id })),
            },
        ];

        const selection = { parents: true as true };
        const query = new TreeNodeQuery({ criteria, selection, options: new TreeNodeQuery.Options({ numMinParents: 1 }) });

        workspace
            .load$<TypedInstance.Selected<TreeNodeModel, typeof query["selection"]>>(query)
            .pipe(finalize(done))
            .subscribe(
                treeNodes => {
                    console.log(treeNodes);

                    if (treeNodes.length > 0) {
                        const parents = treeNodes[0].parents;
                    }
                },
                error => fail(error)
            );
    });

    it("loading some union data", done => {
        const repository = new ShapeRepository();

        const provider: ComponentProvider = {
            getHydrator(model: Class) {
                throw new Error(`no hydrator for class ${model.name} found`);
            },
            getTranslator(query: Query) {
                if (query instanceof ShapeQuery) {
                    return new ShapeQueryTranslator(repository);
                }

                throw new Error(`no hydrator for query models ${query.model.map(m => m.name).join(", ")} found`);
            },
        };

        const workspace = new Workspace(provider);
        const query = new ShapeQuery({ selection: {}, options: createAlwaysReducible() });

        workspace
            .load$<TypedInstance.Selected<Shape, typeof query["selection"]>>(query)
            .pipe(finalize(done))
            .subscribe(
                shapes => {
                    // [todo] instances are untyped
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
                        }
                    }
                },
                error => fail(error)
            );
    });
});
