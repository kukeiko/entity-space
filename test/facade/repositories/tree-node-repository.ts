import { TreeNode } from "../model";
import { generateTreeNodes } from "../data";
import { Instance } from "../../../src/advanced/instance";

export class TreeNodeRepository {
    private _data = new Map(generateTreeNodes().map(x => [x.id, x]));

    all(): Instance<TreeNode>[] {
        return Array.from(this._data.values());
    }

    get(id: number): Instance<TreeNode> | undefined {
        return this._data.get(id);
    }

    getMany(ids: number[]): Instance<TreeNode>[] {
        const found: Instance<TreeNode>[] = [];

        for (let i = 0; i < ids.length; ++i) {
            const treeNode = this._data.get(ids[i]);

            if (treeNode !== void 0) {
                found.push(treeNode);
            }
        }

        return found;
    }

    getLevel(id: number): number {
        let treeNode = this.get(id);
        let level = 0;

        while (treeNode !== void 0 && treeNode.parentId !== null) {
            level++;
            treeNode = this.get(treeNode.parentId);
        }

        return level;
    }

    getTreeNodeParents(childId: number): Instance<TreeNode>[] {
        const child = this.get(childId);

        if (child === void 0) {
            return [];
        }

        const parents: Instance<TreeNode>[] = [];

        let node: Instance<TreeNode> | undefined = child;

        while (node.parentId !== null && (node = this.get(node.parentId)) !== void 0) {
            parents.push(node);
        }

        return parents;
    }
}
