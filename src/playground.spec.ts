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

describe("playground", () => {
    it("query playground (interfaces)", () => {
        interface Reducible {
            reduce(other: this): this | null;
        }

        interface Query<T extends Model = Model, S extends string = "default", A extends Reducible = Reducible> {
            model: T;
            arguments: A;
            scope: S;
        }

        type ScalarQuery<T extends Model.Scalar = Model.Scalar, S extends string = "default", A extends Reducible = Reducible> = Query<T, S, A>;

        interface ObjectQuery<T = Object, S extends string = "default", A extends Reducible = Reducible> extends Query<Model.Object<T>, S, A> {
            criteria?: ObjectCriteria<T>;
            selection?: Selection<T>;
        }

        type CreateQueryArgs<Q extends Query> = (Reducible extends Q["arguments"] ? {} : { arguments: Q["arguments"] }) &
            ("default" extends Q["scope"] ? {} : { scope: Q["scope"] });

        type CreateScalarQueryArgs<Q extends ScalarQuery> = CreateQueryArgs<Q> & {
            model: Q["model"];
        };

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

        type TreeNodeQuery = ObjectQuery<TreeNode>;
        type TreeNodeLevelQuery = Query<Model.Number, "tree-node-level">;

        query<TreeNodeQuery>({ model: () => TreeNode, selection: { parent: { name: true } }, criteria: [{ id: [{ op: "in", values: new Set([1]) }] }] });
        query<TreeNodeLevelQuery>({ model: { type: "number", format: "float" }, scope: "tree-node-level" });

        query<TreeNodeQuery>({ model: () => TreeNode, selection: { name: true }, criteria: [{ id: [{ op: "==", value: 1 }] }] });

        interface Queries<M extends Query = Query> {
            addQuery<Q extends Query<any, any, any>>(): Queries<M | Q>;
            getScopes(): M["scope"];
            forModel<T>(): ScopedQueries<Extract<M, { model: T }>>;
            forObject<T>(): ScopedQueries<Extract<M, { model: Model.Object<T> }>>;
            forObjectAndScope<T, S>(): Extract<M, { model: Model.Object<T>; scope: S }>;
        }

        interface ScopedQueries<T extends Query> {
            inScope<S extends T["scope"]>(scope: S): Extract<T, { scope: S }>;
        }

        const foo = (({} as any) as Queries).addQuery<TreeNodeQuery>().addQuery<TreeNodeLevelQuery>();
        const scopes = foo.getScopes();

        foo.forModel<Model.Number>().inScope("tree-node-level").scope;
        foo.forObject<TreeNode>().inScope("default").model.class;
        foo.forObjectAndScope<TreeNode, "default">().scope;

        const treeNodeQuery: TreeNodeQuery = {
            arguments: {
                reduce() {
                    return this;
                },
            },
            model: {
                class: () => TreeNode,
                type: "object",
            },
            scope: "default",
        };
    });

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
