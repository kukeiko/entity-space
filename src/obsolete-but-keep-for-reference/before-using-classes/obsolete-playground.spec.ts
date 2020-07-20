import { Observable, of } from "rxjs";
import { Model } from "../model";
import { Selection } from "../selection";
import { Query } from "./query";
import { QueryBuilder } from "./query-builder";
import { QueryResult } from "./query-result";
import { ObjectHydration } from "./object-hydration";
import { QueryResultPacket } from "./query-result-packet";
import { Workspace } from "./workspace";
import { Reducible } from "./reducible";
import { ObjectCriteria } from "../../criteria";
import { Selector } from "../selector";
import { Class } from "../../utils";

/**
 * this is my little playground i use for prototyping.
 */
describe("(obsolete) prototyping-playground", () => {
    it("query classes (again)", () => {
        class Query2<M extends Model = Model, B extends Model.Box<M> = Model.Array<M>, A extends Reducible = Reducible> {
            constructor(model: M, box: B, args?: A) {
                this.model = model;
                this.box = box;
                this.arguments = args;
            }

            readonly model: M;
            readonly box: B;
            arguments?: A;
        }

        type QueryData<Q extends Query2> = Model.ToValue<Q["box"]>;

        class ObjectQuery<M extends Model.Object, B extends Model.Box<M> = Model.Array<M>, A extends Reducible = Reducible> extends Query2<M, B, A> {
            constructor(model: M, box: B, args?: A, criteria?: ObjectCriteria<Model.ToValue<M>>, selection: Selection<Model.ToValue<M>> = {}) {
                super(model, box, args);

                this.criteria = criteria ?? [];
                this.selection = selection;
            }

            criteria: ObjectCriteria<Model.ToValue<M>>;
            selection: Selection<Model.ToValue<M>>;

            select<O>(select: (selector: Selector<Model.ToValue<M>>) => Selector<Model.ToValue<M>, O>): this & { selection: O } {
                return this as any;
            }

            where(criteria: ObjectCriteria<Model.ToValue<M>>): this {
                return this;
            }
        }

        // class Entity

        class TreeNodeQuery extends ObjectQuery<Model.Object<TreeNode>> {
            constructor() {
                super({ class: () => TreeNode, type: "object" }, { type: "array", model: { class: () => TreeNode, type: "object" } });
            }
        }

        const foo = new TreeNodeQuery()
            .select(x =>
                x
                    .children(x => x.children(x => x.children(x => x.children(x => x.parent().name()))))
                    .name()
                    .parent()
            )
            .where([{ id: [{ op: "==", value: 1 }] }]);
    });

    /**
     * Our custom user data type.
     */
    class TreeNode {
        id: number = 0;
        name?: string;
        children?: TreeNode[];
        parent?: TreeNode | null;
        parents?: TreeNode[];
        metadata?: Metadata;
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

    type MetadataQuery = Query<Model.Object<Metadata>, "default">;
    type TreeNodeQuery = Query<Model.Object<TreeNode>, "default">;
    type TreeNodeQueryInOtherScope = Query<Model.Object<TreeNode>, "other-scope">;
    // [todo] i want this to return a Map but still allow selections & criteria
    type TreeNodeParentsQuery = Query<Model.Object<TreeNode>, "parents">;
    type TreeNodeLevelQuery = Query<Model.Number, "tree-node-level">;

    type AllOurQueries = MetadataQuery | TreeNodeQuery | TreeNodeQueryInOtherScope | TreeNodeParentsQuery | TreeNodeLevelQuery;

    /**
     * Idea of this is to have a class that you can ask to easily create queries which you can then customize a bit.
     */
    interface QueryFactory<M extends Query = Query> {
        addQuery<Q extends Query>(): QueryFactory<M | Q>;
        assume<X extends Query>(): QueryFactory<X>;
        query<T>(model: T): ScopedQueries<Extract<M, { model: T }>>;
        queryDefaultScope<T>(model: T): QueryBuilder<Extract<M, { model: T; scope: "default" }>>;
    }

    /**
     * Intermediate class to retrieve a query by defining the scope S.
     */
    interface ScopedQueries<T extends Query> {
        inScope<S extends T["scope"]>(scope: S): QueryBuilder<Extract<T, { scope: S }>>;
        defaultScope(): QueryBuilder<Extract<T, { scope: "default" }>>;
    }

    /**
     * An object that we can use to tell our factory which type of data we want to load.
     */
    const treeNodeLevelModel: Model.Number = {
        format: "int32",
        type: "number",
    };

    /**
     * An object that we can use to tell our factory which type of data we want to load.
     */
    const treeNodeModel: Model.Object<TreeNode> = {
        class: () => TreeNode,
        type: "object",
    };

    const metadataModel: Model.Object<Metadata> = {
        class: () => Metadata,
        type: "object",
    };

    /**
     * Creating a factory that is typed to know about our queries.
     */
    const factory = ({} as any) as QueryFactory<AllOurQueries>;

    xit("workspace playground", () => {
        const workspace = new Workspace();
    });

    xit("core loading mechanism playground", () => {
        interface LoadFromSourcePlanner {
            toLoad<Q extends Query>(pick: (factory: QueryFactory) => Q): { execute(open: (query: Q) => Observable<QueryResultPacket<Q>>): void };
            // [todo] if we have data packets telling us what we can still expect to have returned,
            // we should no longer need this i think. would be amazing!
            discover(discover: () => Promise<(instructions: LoadFromSourcePlanner) => void>): void;
        }

        function load(query: Query, planner: LoadFromSourcePlanner): void {
            planner
                .toLoad(factory =>
                    factory
                        .assume<AllOurQueries>()
                        .query(treeNodeModel)
                        .defaultScope()
                        .select(x => x.name())
                        .build()
                )
                .execute(query => {
                    return of({
                        payload: [],
                        failed: [],
                        open: [],
                        loaded: query,
                    });
                });
            // planner.query()
        }

        interface HydrationPlanner<T> {
            load<Q extends Query>(
                pick: (factory: QueryFactory) => Q
            ): { andAssign(assign: (items: Model.ToValue<T>[], payload: QueryResult<Q>["payload"]) => void): ObjectHydration<Q> };
        }

        function hydrate(result: QueryResult, planner: HydrationPlanner<Model.Object<TreeNode>>): void {
            if (Query.is<TreeNodeQuery>(result.loaded, treeNodeModel, "default")) {
                result.payload;
            }

            const infiniteErrorQuery = factory
                .assume<AllOurQueries>()
                .query(treeNodeModel)
                .defaultScope()
                .select(x => x.name().children(x => x.metadata()))
                .build();

            const foo: Selection.Apply<TreeNode, typeof infiniteErrorQuery["selection"]>[] = [];
            // const foo: Selection.Apply<TreeNode, {}>[] = [];
            const bar = [...foo].map(x => x);

            const planA = planner
                .load(factory =>
                    factory
                        .assume<AllOurQueries>()
                        .query(treeNodeModel)
                        .defaultScope()
                        .select(x => x.name().children(x => x.metadata(x => x.createdBy())))
                        .build()
                )
                .andAssign((needsHydration, loaded) => {
                    const bar = [...loaded.map(x => x)];

                    loaded[0].children[1].metadata.createdBy.id;
                    loaded[0].name;
                    loaded[0].children[0].metadata;
                });
        }
    });

    xit("query creation & duck-typing playground", () => {
        /**
         * Some testing lines to ensure the factory typing works.
         */
        factory.query(treeNodeLevelModel).inScope("tree-node-level");
        const fooQuery: Query = factory.queryDefaultScope(treeNodeModel).build();

        /**
         * This could be a way to duck type any type of query to figure out which one of our queries it is.
         */
        // if (isQuery<TreeNodeQuery>(fooQuery, treeNodeModel, "default")) {
        if (Query.is<TreeNodeQuery>(fooQuery, treeNodeModel, "default")) {
            const instance: TreeNode = new (fooQuery.model.class())();
            fooQuery.scope = "default";
        } else if (Query.is<TreeNodeQueryInOtherScope>(fooQuery, treeNodeModel, "other-scope")) {
            const instance: TreeNode = new (fooQuery.model.class())();
            fooQuery.scope = "other-scope";
        } else if (Query.is<TreeNodeLevelQuery>(fooQuery, treeNodeLevelModel, "tree-node-level")) {
            fooQuery.model.format = "double";
        } else if (Query.is<MetadataQuery>(fooQuery, metadataModel, "default")) {
            const instance: Metadata = new (fooQuery.model.class())();

            if (fooQuery.selection?.createdBy !== void 0) {
                if (fooQuery.selection?.createdBy === true) {
                } else {
                    fooQuery.selection.createdBy.name;
                }
            }
        }

        /**
         * Actual example of creating a query and selecting properties, then having it be strictly typed based on the selection we made.
         */
        const loadSomeTreeNodesQuery = factory
            .query(treeNodeModel)
            .defaultScope()
            .select(x => x.name().children(x => x.name()))
            .select(x => x.parent())
            .where([{ id: [{ op: "in", values: new Set([1, 2]) }], name: [{ op: "!=", value: "baz" }] }])
            .build();

        const result: QueryResult<typeof loadSomeTreeNodesQuery> = {
            loaded: loadSomeTreeNodesQuery,
            payload: [
                {
                    id: 1,
                    children: [
                        {
                            id: 12,
                            name: "bar",
                        },
                    ],
                    name: "foo",
                    parent: {
                        id: 3,
                    },
                },
            ],
        };

        const treeNodeLevelQueryResult: QueryResult<TreeNodeLevelQuery> = {
            payload: [2],
            loaded: {} as any,
        };

        /**
         * Taking the type of selection on the query and using Selection.Appy<T, S> (where S is of type Selection)
         * to get back a type of TreeNode where the selected properties are no longer optional.
         */
        type StrictlyTypedSelectedTreeNode = Selection.Apply<TreeNode, typeof loadSomeTreeNodesQuery["selection"]>;

        /**
         * Testing out by writing data that conforms to the strictly typed selection.
         */
        const loadedTreeNodes: StrictlyTypedSelectedTreeNode[] = [
            {
                children: [
                    {
                        id: 3,
                        name: "bar",
                    },
                ],
                id: 2,
                name: "foo",
                parent: {
                    id: 1,
                },
            },
        ];
    });

    xit("model to actual value playground", () => {
        // type ToValue<T> = T extends Model.Boolean ? boolean : T extends Model.Array<infer U> ? ToValue<U>[] : T extends Model.Object<infer U> ? U : never;

        type BooleanModelValue = Model.ToValue<Model.Boolean>;
        type ArrayModelValue = Model.ToValue<Model.Array<Model.Boolean>>;
        type ArrayOfArrayModelValue = Model.ToValue<Model.Array<Model.Array<Model.Boolean>>>;
        type TreeNodeModelValue = Model.ToValue<Model.Object<TreeNode>>;
        type TreeNodeInNestedMapsModelValue = Model.ToValue<Model.Dictionary<Model.Number, Model.Dictionary<Model.String, Model.Object<TreeNode>>>>;

        const foo: TreeNodeModelValue = new TreeNode();

        const boolModel: Model.Boolean = {} as any;
        const arrayModel: Model.Array<Model.Boolean> = {} as any;
    });
});
