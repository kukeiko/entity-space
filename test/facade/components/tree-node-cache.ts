import { CacheWriter, CacheReader, QueryResult, Query, Instance, TypedInstance, isTypedQueryResult, Primitive, filterByObjectCriteria, isTypedQuery } from "src";
import { TreeNodeModel, TreeNodeQuery } from "../model";

type TreeNodePrimitivesOnly = TypedInstance<TreeNodeModel, "loadable", { value: Primitive[] }>;

export class TreeNodeCache implements CacheWriter, CacheReader {
    private _cache = new Map<number, TreeNodePrimitivesOnly>();

    readFromCache(query: Query): Instance[] {
        if (!isTypedQuery(query, [TreeNodeModel])) {
            return [];
        }

        const items = Array.from(this._cache.values());

        return filterByObjectCriteria(items, query.criteria);
    }

    // [todo] cache references
    writeToCache(result: QueryResult): void {
        if (!isTypedQueryResult(result, [TreeNodeModel])) {
            return;
        }

        for (const treeNode of result.payload) {
            this._addOrMerge(this._toPrimitivesOnly(treeNode));
        }
    }

    private _addOrMerge(treeNode: TreeNodePrimitivesOnly): void {
        let cached = this._cache.get(treeNode.id) || treeNode;
        cached = { ...cached, ...treeNode };
        this._cache.set(treeNode.id, cached);
    }

    private _toPrimitivesOnly(treeNode: TypedInstance<TreeNodeModel>): TreeNodePrimitivesOnly {
        const primitivesOnly = {
            id: treeNode.id,
            name: treeNode.name,
            parentId: treeNode.parentId,
            level: treeNode.level,
            parentIds: treeNode.parentIds,
        };

        if (primitivesOnly.level === void 0) {
            delete primitivesOnly.level;
        }

        if (primitivesOnly.parentIds === void 0) {
            delete primitivesOnly.parentIds;
        }

        return primitivesOnly;
    }
}
