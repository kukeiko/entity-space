import { ValueType as Model, EntityTypeMetadata } from "./metadata";
import { Class, Unbox } from "./lang";
import { ObjectCriteria } from "./criteria";
import { Entity } from "./entity";
import { Selection } from "./selection";

/**
 * this is my little playground i use for prototyping.
 */
describe("prototyping-playground", () => {
    /**
     * Our custom user data type.
     */
    class TreeNode extends Entity<TreeNode, typeof TreeNode> {
        static getMetadata(): EntityTypeMetadata<TreeNode> {
            return {} as any;
        }

        id: number = 0;
        name?: string;
        children?: TreeNode[];
        parent?: TreeNode | null;
        parents?: TreeNode[];
    }

    it("query playground", () => {
        /**
         * Our dynamic selection object needs to store the already selected shape somehow,
         * and we're using a symbol to prevent naming collision (so that users are not restricted in the naming of their data properties).
         */
        const Selected = Symbol();

        /**
         * Type required to generate a dynamic type where each selectable property on a type T is expressed
         * as a function that can be called & chained. See a bit below, there is an actual example using TreeNode.
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

        /**
         * Intermediate class to retrieve a query by defining the scope S.
         */
        interface ScopedQueries<T extends Query> {
            inScope<S extends T["scope"]>(scope: S): Extract<T, { scope: S }>;
            defaultScope(): Extract<T, { scope: "default" }>;
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

        /**
         * Creating a factory that is typed to know about our queries.
         */
        const factory = (({} as any) as Queries).addQuery<TreeNodeQuery>().addQuery<TreeNodeQueryInOtherScope>().addQuery<TreeNodeLevelQuery>();

        /**
         * Some testing lines to ensure the factory typing works.
         */
        factory.query(treeNodeLevelModel).inScope("tree-node-level").scope;
        factory.query(treeNodeModel).inScope("other-scope").scope;
        factory.query(treeNodeModel).defaultScope().scope;
        factory.queryClass(TreeNode).inScope("other-scope").model.class;
        factory.queryClassDefaultScope(TreeNode);

        /**
         * Actual example of creating a query and selecting properties, then having it strictly typed.
         */
        const loadSomeTreeNodesQuery = factory
            .query(treeNodeModel)
            .defaultScope()
            .select((x) => x.name().children((x) => x.name()))
            .select((x) => x.parent());

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
