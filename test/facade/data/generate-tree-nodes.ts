import { Instance } from "@entity-space/model";
import { TreeNodeModel } from "../model";

interface GenerateTreeNodesOptions {
    numMaxChildren: number;
    chanceToHaveChildren: number;
    hasChildrenDiminish: number;
    numRootNodes: number;
    numMaxNodes: number;
}

const defaultOptions: GenerateTreeNodesOptions = {
    numMaxChildren: 7,
    chanceToHaveChildren: 0.3,
    hasChildrenDiminish: 0.7,
    numRootNodes: 4,
    numMaxNodes: 860,
};

export function generateTreeNodes(options: GenerateTreeNodesOptions = defaultOptions): Instance<TreeNodeModel>[] {
    const { chanceToHaveChildren, hasChildrenDiminish, numMaxChildren, numMaxNodes, numRootNodes } = options;
    let id = 1;

    function nextId(): number {
        return id++;
    }

    function generateChildren(allNodes: Instance<TreeNodeModel>[], parent: Instance<TreeNodeModel>, childGenMalus = 1): void {
        const numChildren = Math.floor(Math.random() * numMaxChildren);

        for (let i = 0; i < numChildren; i++) {
            if (allNodes.length >= numMaxNodes) {
                return;
            }

            const childNode: Instance<TreeNodeModel> = {
                id: nextId(),
                name: `${parent.name}-${i}`,
                parentId: parent.id,
            };

            allNodes.push(childNode);

            if (Math.random() < chanceToHaveChildren * childGenMalus) {
                generateChildren(allNodes, childNode, childGenMalus * hasChildrenDiminish);
            }
        }
    }

    const allNodes: Instance<TreeNodeModel>[] = [];

    for (let i = 0; i < numRootNodes; i++) {
        const rootNode: Instance<TreeNodeModel> = {
            id: nextId(),
            name: String.fromCharCode(i + 65),
            parentId: null,
        };

        allNodes.push(rootNode);
        generateChildren(allNodes, rootNode);
    }

    return allNodes;
}
