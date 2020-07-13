import { Observable } from "rxjs";
import { Model } from "./model";
import { Selection } from "./selection";
import { Query } from "./query";
import { QueryBuilder } from "./query-builder";

/**
 * this is my little playground i use for prototyping.
 */
describe("prototyping-playground", () => {
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

    /**
     * [todo] it probably feels more natural if we had to type "QueryResult<M, S, A>" instead of "QueryResult<Query<M, S, A>>"
     */
    interface QueryResult<Q extends Query = Query> {
        // the query that represents the data
        loaded: Q;
        // the loaded data
        data: Query.Payload<Q>;
    }

    xit("core loading mechanism playground", () => {
        interface QueryResultPacket<Q extends Query> extends QueryResult<Query<Q["model"]>> {
            // [todo] i added this so the server could tell the client "you requested data with id in [1,2,3], but i couldn't find [3]"
            // figure out if instead of "what is still left to load" we should instead say "what did we fail to load"
            open?: Query<Q["model"]>[];
        }

        type FetchedQueryResultPacket<Q extends Query> = Promise<QueryResultPacket<Q>> | Observable<QueryResultPacket<Q>>;

        interface LoadPlan<Q extends Query> {
            planned: Q;
            fetch(): FetchedQueryResultPacket<Q>;
        }

        interface LoadFromSourcePlanner {
            toLoad<Q extends Query>(pick: (factory: QueryFactory) => Q): { execute(fetch: (query: Q) => FetchedQueryResultPacket<Q>): void };
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
                    return Promise.resolve({
                        data: [],
                        loaded: query,
                    });
                });
            // planner.query()
        }

        // [todo] make sure we can also have "endless" hydrations, i.e. server continues pushing updated hydration data to the client
        interface HydrationPlan<Q extends Query<any, any, any>> {
            load: Q;
            assign(items: any[], payload: any[]): void;
        }

        interface HydrationPlanner<T> {
            load<Q extends Query>(
                pick: (factory: QueryFactory) => Q
            ): { andAssign(assign: (items: Model.ToValue<T>[], payload: QueryResult<Q>["data"]) => void): HydrationPlan<Q> };
        }

        function hydrate(result: QueryResult, planner: HydrationPlanner<Model.Object<TreeNode>>): void {
            if (Query.is<TreeNodeQuery>(result.loaded, treeNodeModel, "default")) {
                result.data;
            }

            const planA = planner
                .load(factory =>
                    factory
                        .assume<AllOurQueries>()
                        .query(treeNodeModel)
                        .defaultScope()
                        .select(x => x.name().children(x => x.metadata()))
                        .build()
                )
                .andAssign((needsHydration, loaded) => {
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
            data: [
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
            data: [2],
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
        type TreeNodeInNestedMapsModelValue = Model.ToValue<Model.Map2<Model.Number, Model.Map2<Model.String, Model.Object<TreeNode>>>>;

        const foo: TreeNodeModelValue = new TreeNode();

        const boolModel: Model.Boolean = {} as any;
        const arrayModel: Model.Array<Model.Boolean> = {} as any;
    });
});
