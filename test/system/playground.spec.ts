import { Query } from "src/query";

describe("prototyping-playground", () => {
    /**
     * Our custom user data type.
     */
    class TreeNode {
        id: number = 0;
        name: string = "";
        children: TreeNode[] = [];
        parent: TreeNode | null = null;
        parents: TreeNode[] = [];
        metadata?: Metadata;
    }

    class TreeNodeParents {
        childId: number = 0;
        parents: TreeNode[] = [];
    }

    class Metadata {
        createdAt: string = "";
        createdBy?: User;
        updated: string | null = null;
        updatedBy?: User | null;
    }

    class User {
        id: number = 0;
        name?: string = "";
    }

    it("playing around", () => {});
});
