import { finalize } from "rxjs/operators";
import { Workspace, ObjectCriteria } from "src";
import {
    TreeNodeQueryTranslator,
    TreeNodeQuery,
    TreeNodeRepository,
    TreeNode,
    TreeNodeLevelQuery,
    TreeNodeLevelQueryTranslator,
    TreeNodePayloadHydrator,
    TreeNodeParentsQuery,
    TreeNodeParentsQueryTranslator,
} from "../facade";

fdescribe("core-loading-mechanism", () => {
    it("translator", done => {
        const workspace = new Workspace();
        const repository = new TreeNodeRepository();
        workspace.setTranslator(TreeNodeQuery, new TreeNodeQueryTranslator(repository));
        workspace.setTranslator(TreeNodeLevelQuery, new TreeNodeLevelQueryTranslator(repository));
        workspace.setTranslator(TreeNodeParentsQuery, new TreeNodeParentsQueryTranslator(repository));
        workspace.setHydrator(TreeNode, new TreeNodePayloadHydrator());

        const someIds = repository
            .all()
            .slice(10, 13)
            .map(x => x.id);

        const criteria: ObjectCriteria<TreeNode> = [
            {
                // [todo] not using someIds.map(x => ...) here because no autocomplete yet
                id: [
                    { op: "==", value: someIds[0] },
                    { op: "==", value: someIds[1] },
                    { op: "==", value: someIds[2] },
                ],
            },
        ];

        const selection = { level: true as true, parents: true as true };

        const query = new TreeNodeQuery({ criteria, selection });

        workspace
            .load$(query)
            .pipe(finalize(done))
            .subscribe(
                treeNodes => {
                    console.log("result:", treeNodes);
                    // line to test that level is not undefined
                    const level: number = treeNodes[0].level;
                },
                error => fail(error)
            );
    });
});
