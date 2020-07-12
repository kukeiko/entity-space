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

    xit("query playground", () => {
        type MetadataQuery = Query<Model.Object<Metadata>, "default">;
        type TreeNodeQuery = Query<Model.Object<TreeNode>, "default">;
        type TreeNodeQueryInOtherScope = Query<Model.Object<TreeNode>, "other-scope">;
        type TreeNodeLevelQuery = Query<Model.Number, "tree-node-level">;

        type AllOurQueries = MetadataQuery | TreeNodeQuery | TreeNodeQueryInOtherScope | TreeNodeLevelQuery;

        /**
         * Idea of this is to have a class that you can ask to easily create queries which you can then customize a bit.
         */
        interface Queries<M extends Query = Query> {
            addQuery<Q extends Query>(): Queries<M | Q>;
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
        const factory = (({} as any) as Queries).addQuery<AllOurQueries>();

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
            .select((x) => x.name().children((x) => x.name()))
            .select((x) => x.parent())
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

        type QueryPayload<Q extends Query> = Q["model"] extends Model.Object
            ? Selection.Apply<Model.ToValue<Q["model"]>, Exclude<Q["selection"], undefined>>[]
            : Model.ToValue<Q["model"]>[];

        /**
         * [todo] it probably feels more natural if we had to type "QueryResult<M, S, A>" instead of "QueryResult<Query<M, S, A>>"
         */
        interface QueryResult<Q extends Query> {
            // the query that represents the payload
            loaded: Q;
            // payload: Q["model"] extends Model.Object ? Selection.Apply<Model.ToValue<Q["model"]>, Exclude<Q["selection"], undefined>>[] : Model.ToValue<Q["model"]>[];
            payload: QueryPayload<Q>;
        }

        interface QueryResultPacket<Q extends Query> extends QueryResult<Q> {
            // [todo] i added this so the server could tell the client "you requested data with id in [1,2,3], but i couldn't find [3]"
            // figure out if instead of "what is still left to load" we should instead say "what did we fail to load"
            open?: Q[];
        }

        interface LoadPlan<Q extends Query> {
            planned: Q;
            fetch(): Promise<QueryResultPacket<Q>> | Observable<QueryResultPacket<Q>>;
        }

        interface LoadFromSourcePlanner<T> {
            plan(query: any): { execute(fn: () => any): void };
            discover(fn: (query: any) => Promise<(instructions: LoadFromSourcePlanner<T>) => void>): void;
        }

        function load(): void {
            /**
             * the important part is that entity-space knows when it should try to activate its known hydrators after receiving data
             * that is not fully hydrated. maybe the server will deliver more hydrations, or maybe entity-space needs to to it itself.
             *
             * - i can return data in chunks per identity
             * - i can further chunkify based on hydration - so i might deliver same identity more often, but with increasingly more hydrated data
             *
             * a) i know how to directly load from source, therefore i will supply the query and the data loader
             * b) i am a proxy to a server running entity-space, i have to contact the source to know more. therefore i will have to contact the source,
             * which will tell me what it can load and how to do the data loading
             */
            /**
             * - i took your query and know how to load part or all of it - here is the query that describes the complete data you'll get if you execute this function
             * - i took your query and don't know jack - i'll have to ask a server on how to do it
             */
        }

        // [todo] make sure we can also have "endless" hydrations, i.e. server continues pushing updated hydration data to the client
        interface HydrationPlan<Q extends Query<any, any, any>> {
            load: Q;
            assign(items: any[], payload: any[]): void;
        }

        interface HydrationPlanner<T> {
            load<Q extends Query<any, any, any>>(query: Q): { andAssign(assign: (items: Model.ToValue<T>[], payload: QueryResult<Q>["payload"]) => void): HydrationPlan<Q> };
        }

        function hydrate(planner: HydrationPlanner<Model.Object<TreeNode>>): void {
            const planA = planner
                .load(
                    factory
                        .query(treeNodeModel)
                        .defaultScope()
                        .select((x) => x.name().children((x) => x.metadata()))
                        .build()
                )
                .andAssign((needsHydration, loaded) => {
                    loaded[0].name;
                    loaded[0].children[0].metadata;
                });
        }
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
