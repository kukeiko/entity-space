import { finalize } from "rxjs/operators";
import { Workspace, Criteria, select } from "src";
import { TreeNodeQuery, TreeNodeLevelQuery, TreeNodeParentsQuery, TreeNodeModel } from "../facade/model";
import { TreeNodePayloadHydrator, TreeNodeQueryTranslator, TreeNodeLevelQueryTranslator, TreeNodeParentsQueryTranslator } from "../facade/components";
import { TreeNodeRepository } from "../facade/data";

xdescribe("core-loading-mechanism", () => {
    it("loading some data", done => {
        const workspace = new Workspace();
        const repository = new TreeNodeRepository();

        workspace.setTranslator(TreeNodeQuery, new TreeNodeQueryTranslator(repository));
        workspace.setTranslator(TreeNodeLevelQuery, new TreeNodeLevelQueryTranslator(repository));
        workspace.setTranslator(TreeNodeParentsQuery, new TreeNodeParentsQueryTranslator(repository));
        workspace.setHydrator(TreeNodeModel, new TreeNodePayloadHydrator());

        const someIds = repository
            .all()
            .sort(() => (Math.random() > 0.5 ? -1 : 1))
            .slice(0, 7)
            .map(x => x.id);

        const criteria: Criteria<TreeNodeModel> = [
            {
                // [todo] not using someIds.map(x => ...) here because no autocomplete yet
                id: [
                    { op: "==", value: someIds[0] },
                    { op: "==", value: someIds[1] },
                    { op: "==", value: someIds[2] },
                ],
            },
        ];

        const selection = select(TreeNodeModel, x => x.parents().createdBy(x => x.createdBy()));
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
});
