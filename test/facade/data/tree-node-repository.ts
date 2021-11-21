import { Instance } from "src";
import { TreeNodeModel } from "../model";
import { generateTreeNodes } from "./generate-tree-nodes";

export class TreeNodeRepository {
    private _data = new Map(generateTreeNodes().map(x => [x.id, x]));

    all(): Instance<TreeNodeModel>[] {
        return this._clone(Array.from(this._data.values()));
    }

    get(id: number, numMinParents = 0): Instance<TreeNodeModel> | undefined {
        const item = this._data.get(id);

        if (numMinParents > 0) {
            let parentId = item?.parentId;
            let numParents = 0;

            while (parentId) {
                let parent = this.get(parentId);

                if (parent !== void 0) {
                    numParents++;
                    parentId = parent.parentId;
                } else {
                    break;
                }
            }

            if (numParents < numMinParents) {
                return void 0;
            }
        }

        if (item !== void 0) {
            return this._clone([item])[0];
        }
    }

    getMany(ids: number[]): Instance<TreeNodeModel>[] {
        const found: Instance<TreeNodeModel>[] = [];

        for (let i = 0; i < ids.length; ++i) {
            const treeNode = this._data.get(ids[i]);

            if (treeNode !== void 0) {
                found.push(treeNode);
            }
        }

        return this._clone(found);
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

    private _clone(items: Instance<TreeNodeModel>[]): Instance<TreeNodeModel>[] {
        return JSON.parse(JSON.stringify(items));
    }
}
