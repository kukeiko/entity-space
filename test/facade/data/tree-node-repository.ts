import { Instance } from "src";
import { TreeNodeModel } from "../model";
import { generateTreeNodes } from "./generate-tree-nodes";

export class TreeNodeRepository {
    private _data = new Map(generateTreeNodes().map(x => [x.id, x]));

    all(): Instance<TreeNodeModel>[] {
        return Array.from(this._data.values());
    }

    get(id: number): Instance<TreeNodeModel> | undefined {
        return this._data.get(id);
    }

    getMany(ids: number[]): Instance<TreeNodeModel>[] {
        const found: Instance<TreeNodeModel>[] = [];

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

    getTreeNodeParents(childId: number): Instance<TreeNodeModel>[] {
        const child = this.get(childId);

        if (child === void 0) {
            return [];
        }

        const parents: Instance<TreeNodeModel>[] = [];

        let node: Instance<TreeNodeModel> | undefined = child;

        while (node.parentId !== null && (node = this.get(node.parentId)) !== void 0) {
            parents.push(node);
        }

        return parents;
    }
}
