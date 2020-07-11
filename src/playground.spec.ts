import { ValueType as Model, EntityTypeMetadata } from "./metadata";
import { Class, Unbox } from "./lang";
import { ObjectCriteria } from "./criteria";
import { Entity } from "./entity";
import { Selection } from "./selection";

export class TreeNode extends Entity<TreeNode, typeof TreeNode> {
    static getMetadata(): EntityTypeMetadata<TreeNode> {
        return {} as any;
    }

    id: number = 0;
    name?: string;
    children?: TreeNode[];
    parent?: TreeNode | null;
    parents?: TreeNode[];
}

/**
 * this is my little playground i use for prototyping.
 */
describe("prototyping-playground", () => {
    it("query playground (interfaces)", () => {
        type PickableSelection<T> = { [K in keyof Selection<T>]-?: K };

        const Selected = Symbol();

        type Selector<T, M = {}> = {
            [K in keyof PickableSelection<T>]: <O extends Selector<T[K]>>(
                expand?: (selector: Selector<Exclude<Unbox<T[K]>, null | undefined>>) => O
            ) => Selector<T, M & Record<K, O extends undefined ? true : {} extends O[typeof Selected] ? true : O[typeof Selected]>>;
        } & { [Selected]: M };

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
        }

        /**
         * A query that returns scalar values, such as int and int[].
         * If we canna go crazy we could also try and support things like string[][] and Map<string, int[[int],[int]][][]>.
         */
        type ScalarQuery<T extends Model.Scalar = Model.Scalar, S extends string = "default", A extends Reducible = Reducible> = Query<T, S, A>;

        /**
         * A query that returns object values.
         *
         * It can have criteria for the objects (basic propert value based filtering)
         */
        interface ObjectQuery<T = Object, S extends string = "default", A extends Reducible = Reducible> extends Query<Model.Object<T>, S, A> {
            criteria?: ObjectCriteria<T>;
            selection?: Selection<T>;
            select<O>(select: (selector: Selector<T>) => Selector<T, O>): this & { selection: O };
        }

        type TreeNodeQuery = ObjectQuery<TreeNode>;
        type TreeNodeQueryInOtherScope = ObjectQuery<TreeNode, "other-scope">;
        type TreeNodeLevelQuery = Query<Model.Number, "tree-node-level">;

        /**
         * Idea of this is to have a class that you can ask to easily create queries which you can then customize a bit.
         */
        interface Queries<M extends Query = Query> {
            addQuery<Q extends Query<any, any, any>>(): Queries<M | Q>;
            getScopes(): M["scope"];
            query<T>(model: T): ScopedQueries<Extract<M, { model: T }>>;
            queryClass<T>(model: Class<T>): ScopedQueries<Extract<M, { model: Model.Object<T> }>>;
            queryClassDefaultScope<T>(model: Class<T>): Extract<M, { model: Model.Object<T>; scope: "default" }>;
        }

        interface ScopedQueries<T extends Query> {
            inScope<S extends T["scope"]>(scope: S): Extract<T, { scope: S }>;
            defaultScope(): Extract<T, { scope: "default" }>;
        }

        const treeNodeLevelModel: Model.Number = {
            format: "int32",
            type: "number",
        };

        const treeNodeModel: Model.Object<TreeNode> = {
            class: () => TreeNode,
            type: "object",
        };

        const factory = (({} as any) as Queries).addQuery<TreeNodeQuery>().addQuery<TreeNodeQueryInOtherScope>().addQuery<TreeNodeLevelQuery>();
        const scopes = factory.getScopes();

        factory.query(treeNodeLevelModel).inScope("tree-node-level").scope;
        factory.query(treeNodeModel).inScope("other-scope").scope;
        factory.query(treeNodeModel).defaultScope().scope;
        factory.queryClass(TreeNode).inScope("other-scope").model.class;
        factory.queryClassDefaultScope(TreeNode);

        const loadSomeTreeNodesQuery = factory
            .query(treeNodeModel)
            .defaultScope()
            .select((x) => x.name().children((x) => x.name()))
            .select((x) => x.parent());

        type StrictlyTypedSelectedTreeNode = Selection.Apply<TreeNode, typeof loadSomeTreeNodesQuery["selection"]>;

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

        /**
         * older prototyping stuff that can probably be deleted soon
         */
        type CreateQueryArgs<Q extends Query> = (Reducible extends Q["arguments"] ? {} : { arguments: Q["arguments"] }) &
            ("default" extends Q["scope"] ? {} : { scope: Q["scope"] });

        type CreateScalarQueryArgs<Q extends ScalarQuery> = CreateQueryArgs<Q> & {
            model: Q["model"];
        };

        /**
         * The instantiated type of a model of an object query.
         */
        type ObjectQueryModelInstanceType<Q extends ObjectQuery> = InstanceType<ReturnType<Q["model"]["class"]>>;

        type CreateObjectQueryArgs<Q extends ObjectQuery> = CreateQueryArgs<Q> & {
            model: Q["model"]["class"];
            criteria?: ObjectCriteria<ObjectQueryModelInstanceType<Q>>;
            selection?: Selection<ObjectQueryModelInstanceType<Q>>;
        };

        function query<Q extends ScalarQuery<any, any, any>>(args: CreateScalarQueryArgs<Q>): Q;
        function query<Q extends ObjectQuery<any, any, any>>(args: CreateObjectQueryArgs<Q>): Q;
        function query(...args: any[]): any {
            return {};
        }

        query<TreeNodeQuery>({ model: () => TreeNode, selection: { parent: { name: true } }, criteria: [{ id: [{ op: "in", values: new Set([1]) }] }] });
        query<TreeNodeLevelQuery>({ model: { type: "number", format: "float" }, scope: "tree-node-level" });
        query<TreeNodeQuery>({ model: () => TreeNode, selection: { name: true }, criteria: [{ id: [{ op: "==", value: 1 }] }] });
    });

    /**
     * i had this before i started w/ interface prototyping, can probably delete soon
     */
    it("query playground (classes)", () => {
        interface Reducible {
            reduce(other: this): this | null;
        }

        // interface Query<T extends ValueType, A extends Reducible, S> {
        // class Query<T extends ValueType, A, S> {
        class Query<T extends Model, A> {
            constructor(args: { model: T; arguments: A }) {
                this.model = args.model;
                this.arguments = args.arguments;
            }

            readonly model: T;
            readonly arguments: A;
        }

        class ObjectQuery<T, A extends QueryArguments = QueryArguments> extends Query<Model.Object<T>, A> {
            constructor(args: { class: Class<T>; arguments: A; criteria?: ObjectCriteria<T>; selection?: Selection<T> }) {
                super({
                    arguments: args.arguments,
                    model: { class: () => args.class, type: "object" },
                });
            }

            criteria?: ObjectCriteria<T>;
            selection?: Selection<T>;
        }

        interface ObjectQueryDefaultCtorArgs<T> {
            criteria?: ObjectCriteria<T>;
            selection?: Selection<T>;
        }

        class TreeNodeQuery extends ObjectQuery<TreeNode> {
            constructor(args: ObjectQueryDefaultCtorArgs<TreeNode>) {
                super({
                    arguments: new QueryArguments(),
                    class: TreeNode,
                    criteria: args.criteria,
                    selection: args.selection,
                });
            }
        }

        class QueryArguments implements Reducible {
            reduce(other: this): this | null {
                return other;
            }
        }

        class TreeNodeLevelQueryArguments extends QueryArguments {
            readonly treeNodeIds: number[] = [];

            reduce(other: this): this | null {
                // [todo] use reduction logic from /criteria folder
                return other;
            }
        }

        // interface TreeNodeLevelQuery extends Query<ValueType.Number, Reducible & { ids: number[] }, "tree-node-level"> {}
        // // interface TreeNodeQuery extends ObjectQuery<TreeNode, {}, "all"> {}

        // interface Workspace<M = {}> {}

        // const foo2: TreeNodeLevelQuery = {
        //     arguments: {
        //         // reduce(other: this) {
        //         //     return other.reduce(this);
        //         // },
        //         ids: [3],
        //     },
        // } as any;

        // const foo: TreeNodeQuery = {
        //     model: {
        //         class: () => TreeNode,
        //         type: "object",
        //     },
        //     criteria: [
        //         {
        //             id: [{ op: "from-to", from: { op: ">", value: "3" }, to: { op: "<", value: 9 } }],
        //         },
        //     ],
        //     arguments: {},
        //     scope: "all",
        //     selection: {
        //         parent: {
        //             name: true,
        //         },
        //     },
        // };

        // const bar = new (foo.model.class())();
    });

    /**
     * this is just my little playground for figuring out how to do strictly typed hydrations.
     */
    xit("strictly typed hydrations playground", () => {
        type PickableSelection<T> = { [K in keyof Selection<T>]-?: K };

        type Selector<T, M = {}> = {
            [K in keyof PickableSelection<T>]: <O extends Selector<T[K]>>(
                expand?: (selector: Selector<Exclude<Unbox<T[K]>, null | undefined>>) => O
            ) => Selector<T, M & Record<K, O extends undefined ? true : {} extends O["selected"] ? true : O["selected"]>>;
        } & {
            selected: M;
        };

        const userNode: Selector<TreeNode> = {} as any;
        const bar = userNode
            .name()
            .parent((x) => x.name())
            .children((x) => x.parent((x) => x.name()).children()).selected;

        type TypeSafeSelectedTreeNode = Selection.Apply<TreeNode, typeof bar>;

        const treeNode: TypeSafeSelectedTreeNode = {
            id: 3,
            children: [
                {
                    children: [],
                    id: 8,
                    parent: {
                        id: 3,
                        name: "bar",
                    },
                },
            ],
            parent: {
                id: 2,
                name: "foo",
            },
            name: "bar",
        };
    });
});
