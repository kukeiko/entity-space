import { finalize } from "rxjs/operators";
import { Workspace, Criteria, select } from "src";
import { TreeNodeQuery, TreeNodeLevelQuery, TreeNodeParentsQuery, TreeNodeModel, ShapeQuery, TreeNodeParentsModel } from "../facade/model";
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
        const workspace = new Workspace();
        const repository = new TreeNodeRepository();
        const treeNodeHydrator = new TreeNodePayloadHydrator();

        workspace.setTranslator(TreeNodeQuery, new TreeNodeQueryTranslator(repository));
        workspace.setTranslator(TreeNodeLevelQuery, new TreeNodeLevelQueryTranslator(repository));
        workspace.setTranslator(TreeNodeParentsQuery, new TreeNodeParentsQueryTranslator(repository));
        workspace.setHydrator(TreeNodeModel, treeNodeHydrator);
        workspace.setHydrator(TreeNodeParentsModel, new TreeNodeParentsHydrator(treeNodeHydrator));

        const someIds = repository
            .all()
            // .sort(() => (Math.random() > 0.5 ? -1 : 1))
            .slice(0, 7)
            .map(x => x.id);

        const criteria: Criteria<TreeNodeModel> = [
            {
                id: someIds.map(id => ({ op: "==", value: id })),
            },
        ];

        const selection = select([TreeNodeModel], x => x.parents(x => x.level().parents(x => x.level())));
        const query = new TreeNodeQuery({ criteria, selection });

        workspace
            .load$(query)
            .pipe(finalize(done))
            .subscribe(
                treeNodes => {
                    console.log(treeNodes);
                },
                error => fail(error)
            );
    });

    it("loading some union data", done => {
        const workspace = new Workspace();
        const repository = new ShapeRepository();

        workspace.setTranslator(ShapeQuery, new ShapeQueryTranslator(repository));
        const query = new ShapeQuery({ selection: {} });

        workspace
            .load$(query)
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
                        }
                    }
                },
                error => fail(error)
            );
    });
});
