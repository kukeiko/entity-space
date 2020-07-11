import { ValueType as Model } from "./metadata";
import { Class, Unbox } from "./lang";
import { ObjectCriteria } from "./criteria";
import { Selection } from "./selection";

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

    it("model to actual value playground", () => {
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

    it("query playground", () => {
        /**
         * Our dynamic selection object needs to store the already selected shape somehow,
         * and we're using a symbol to prevent naming collision (so that users are not restricted in the naming of their data properties).
         */
        const Selected = Symbol();

        /**
         * Type required to generate a dynamic type where each selectable property on a type T is expressed
         * as a function that can be called & chained. See a bit below, there is an actual example using TreeNode.
         *
         * [todo] figure out if we could use ES6 proxy so that we don't need metadata to know for which selectable properties we have to create functions for.
         */
        type Selector<T, M = {}> = {
            [K in keyof PickableSelection<T>]: <O extends Selector<T[K]>>(
                /**
                 * With expand we can select properties of a nested type like references & children.
                 */
                expand?: (selector: Selector<Exclude<Unbox<T[K]>, null | undefined>>) => O
            ) => Selector<T, M & Record<K, O extends undefined ? true : {} extends O[typeof Selected] ? true : O[typeof Selected]>>;
        } & { [Selected]: M };

        /**
         * Intermediate helper type required for the Selector type above.
         *
         * [todo] this can probably removed and the Selector type be simplified.
         */
        type PickableSelection<T> = { [K in keyof Selection<T>]-?: K };

        /**
         * Something that knows how to reduce something else of the same shape.
         *
         * Examples:
         * - { id: equals 1 } could reduce { id: equals 1 } to null
         * - { id: equals 1 } could reduce { id: in [1,2,3] } to { id: in [2,3] }
         * - { foo: { bar, baz } } could reduce { foo: { bar, baz, zoo } } to { foo: { zoo } }
         */
        interface Reducible {
            reduce(other: this): this | null;
        }

        type ModelCriteria<T> = T extends Model.Object<infer U> ? ObjectCriteria<U> : never;
        type ModelSelection<T> = T extends Model.Object<infer U> ? Selection<U> : never;

        /**
         * Something that can be executed to load data, where the data is in the form of T.
         * The scope allows us to have different API calls for the same type of data.
         * Each of those API calls can have custom arguments A.
         *
         * The custom arguments A need to be reducible to allow this library to identify if that call is already being made and/or cached.
         */
        interface Query<T extends Model = Model, S extends string = "default", A extends Reducible = Reducible> {
            model: T;
            arguments: A;
            scope: S;
            criteria?: ModelCriteria<T>;
            selection?: ModelSelection<T>;
        }

        type ModelInstanceFromQuery<Q> = Q extends Query<infer T, any, any> ? (T extends Model.Object<infer U> ? U : never) : never;

        interface QueryBuilder<Q extends Query<any, any, any>> {
            [Selected]: Selection<ModelInstanceFromQuery<Q>>;
            arguments(): this;
            select<O>(select: (selector: Selector<ModelInstanceFromQuery<Q>>) => Selector<ModelInstanceFromQuery<Q>, O>): this & { [Selected]: O };
            where(criteria: ObjectCriteria<ModelInstanceFromQuery<Q>>): this;
            build(): Q & Record<"selection", this[typeof Selected]>;
        }

        type MetadataQuery = Query<Model.Object<Metadata>>;
        type TreeNodeQuery = Query<Model.Object<TreeNode>>;
        type TreeNodeQueryInOtherScope = Query<Model.Object<TreeNode>, "other-scope">;
        type TreeNodeLevelQuery = Query<Model.Number, "tree-node-level">;

        type AllOurQueries = MetadataQuery | TreeNodeQuery | TreeNodeQueryInOtherScope | TreeNodeLevelQuery;

        /**
         * Idea of this is to have a class that you can ask to easily create queries which you can then customize a bit.
         *
         * [todo] return query builders instead if possible
         */
        interface Queries<M extends Query = Query> {
            addQuery<Q extends Query<any, any, any>>(): Queries<M | Q>;
            query<T>(model: T): ScopedQueries<Extract<M, { model: T }>>;
            queryDefaultScope<T>(model: T): QueryBuilder<Extract<M, { model: T; scope: "default" }>>;
        }

        function isQuery<Q extends Query<any, any, any>>(query: any, model: Q["model"], scope: Q["scope"]): query is Q {
            // [todo] check model & scope equality
            return {} as any;
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
        const fooQuery: Query<any, any, any> = factory.queryDefaultScope(treeNodeModel).build();

        /**
         * This could be a way to duck type any type of query to figure out which one of our queries it is.
         */
        if (isQuery<TreeNodeQuery>(fooQuery, treeNodeModel, "default")) {
            const instance: TreeNode = new (fooQuery.model.class())();
            fooQuery.scope = "default";
        } else if (isQuery<TreeNodeQueryInOtherScope>(fooQuery, treeNodeModel, "other-scope")) {
            const instance: TreeNode = new (fooQuery.model.class())();
            fooQuery.scope = "other-scope";
        } else if (isQuery<TreeNodeLevelQuery>(fooQuery, treeNodeLevelModel, "tree-node-level")) {
            fooQuery.model.format = "double";
        } else if (isQuery<MetadataQuery>(fooQuery, metadataModel, "default")) {
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
});
