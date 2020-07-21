import { finalize } from "rxjs/operators";
import { Workspace } from "src";
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
import { EntityCriteria } from "../../src/advanced/entity-criteria";
import { ObjectSelector, Selected, select } from "../../src/advanced/selector";

fdescribe("core-loading-mechanism", () => {
    it("loading some data", done => {
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

        const criteria: EntityCriteria<TreeNode> = [
            {
                // [todo] not using someIds.map(x => ...) here because no autocomplete yet
                id: [
                    { op: "==", value: someIds[0] },
                    { op: "==", value: someIds[1] },
                    { op: "==", value: someIds[2] },
                ],
            },
        ];

        const selector: ObjectSelector<TreeNode> = {} as any;
        // const selection = selector.parents(x => x.parents(x => x.createdBy().level())).createdBy()[Selected];
        const selection = select(new TreeNode(), x => x.parents());
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
