import { Subject } from "rxjs";
import { reduce } from "rxjs/operators";
import { TypedQuery, TypedInstance, TypedSelection, TypedSelector, reduceQueries, createAlwaysReducible, createProperty, Query } from "src";
import { TreeNodeModel, CanvasModel, CircleModel, SquareModel, TriangleModel, Shape, AuthorModel } from "../facade/model";

xdescribe("prototyping-playground", () => {
    const treeNodeCreatable: TypedInstance<TreeNodeModel, "creatable"> = {
        name: "foo",
        parentId: 3,
    };

    const treeNodePatch: TypedInstance<TreeNodeModel, "patchable"> = {
        name: "foo",
    };

    it("redo select() for moar performance", () => {
        const selector = new TypedSelector([TreeNodeModel]);
        const selection = selector
            .select(
                x => x.children,
                x =>
                    x.select(
                        x => x.parents,
                        x => x.select(x => x.level)
                    )
            )
            .select(x => x.metadata)
            .select(
                x => x.children,
                x => x.select(x => x.name)
            )
            .get();
    });

    it("playing w/ unions", () => {
        class CanvasQuery extends TypedQuery<CanvasModel> {
            getModel() {
                return [CanvasModel];
            }

            model = [CanvasModel];
        }

        type CanvasQueryDefaultPayload = TypedQuery.Payload<CanvasQuery>;

        const defaultPayload: CanvasQueryDefaultPayload = [
            {
                id: 1,
                name: "foo",
                authorId: 8,
                shapes: [{ type: "triangle", id: 1 }],
            },
        ];

        const canvasSelection: TypedSelection<CanvasModel> = {
            author: true,
            shapes: {
                canvas: true,
                angleA: true,
                area: true,
                angleB: true,
                length: true,
            },
        };

        // const selection = select([CanvasModel], x => x.author(x => x.name()).shapes(x => x.area().radius().length().canvas().angleA().angleB().angleC()));

        const selection = new TypedSelector([CanvasModel])
            // .select(x => x.id)
            .select(x => x.author)
            .select(
                x => x.shapes
                // [todo] selecting the type bricked the models below (property "type" is missing)
                // x => x.select(x => x.type).select(x => x.length),
            )
            .get();

        const selectedInstance: TypedInstance.Selected<CanvasModel, typeof selection> = {
            id: 7,
            authorId: 3,
            author: {
                id: 3,
                name: "susi",
            },
            name: "malwand",
            shapes: [
                // {
                // }
                // { id: 8, type: "square", area: 3, length: 2, canvas: { id: 7, name: "malwand" } },
                // { id: 19, type: "circle", area: 9, radius: 123, canvas: { id: 7, name: "malwand" } },
                // { id: 21, type: "triangle", area: 13, angleA: 1, angleB: 2, angleC: 3, canvas: { id: 7, name: "malwand" } },
            ],
        };
    });

    it("union criteria", () => {
        // const canvasCriteria: TypedCriteria<CanvasModel> = [
        //     {
        //         shapes: [
        //             {
        //                 angleA: [{ op: ">", value: 3 }],
        //                 angleB: [{ op: ">", value: 3 }],
        //                 angleC: [{ op: ">", value: 3 }],
        //                 area: [{ op: ">", value: 3 }],
        //                 id: [{ op: ">", value: 3 }],
        //                 length: [{ op: ">", value: 3 }],
        //                 radius: [{ op: ">", value: 3 }],
        //                 canvas: [
        //                     {
        //                         shapes: [
        //                             {
        //                                 angleA: [{ op: ">", value: 3 }],
        //                                 angleB: [{ op: ">", value: 3 }],
        //                                 angleC: [{ op: ">", value: 3 }],
        //                                 area: [{ op: ">", value: 3 }],
        //                                 id: [{ op: ">", value: 3 }],
        //                                 length: [{ op: ">", value: 3 }],
        //                                 radius: [{ op: ">", value: 3 }],
        //                             },
        //                         ],
        //                     },
        //                 ],
        //             },
        //         ],
        //     },
        // ];
    });

    it("union as entry type", () => {
        type ShapeModels = CircleModel | SquareModel | TriangleModel;
        type UnionQuery = TypedQuery<ShapeModels>;
        type UnionQueryPayload = TypedQuery.Payload<UnionQuery>;

        const payload: UnionQueryPayload = [
            {
                type: "triangle",
                id: 1,
                angleA: 3,
            },
        ];

        class ShapeQuery extends TypedQuery<ShapeModels> {
            getModel() {
                return [CircleModel, SquareModel, TriangleModel];
            }

            model = [CircleModel, SquareModel, TriangleModel];
        }

        type ShapeQueryPayload = TypedQuery.Payload<ShapeQuery>;

        const shapeQueryPayload: ShapeQueryPayload = [
            {
                type: "triangle",
                id: 1,
                angleA: 3,
            },
            {
                type: "square",
                id: 3,
                length: 8,
            },
        ];

        // const selection = select([CircleModel, SquareModel, TriangleModel], x => x.canvas(x => x.shapes(x => x.canvas())));

        // const selectedInstances : Instance.Selected<ShapeModels, typeof selection>[] = [
        //     {
        //         canvas: {
        //             shapes: [{
        //                 type: "circle",

        //             }]
        //         }
        //     }
        // ];
    });

    /**
     * The following spec will guide you through the simplest example we can think of: loading 1 entity and 1 relation of it,
     * but the initial entity is loaded from service A, and its relation is loaded from service B.
     *
     * We will have 1 client that creates and sends the query.
     * We will have 1 server that receives that 1 query and asks registered components to load that data.
     */
    it("aggregating data from 2 services", () => {
        interface Payload<T> {
            query: TypedQuery<T>;
            items: TypedInstance<T>[];
        }

        class AuthorModel {
            id = createProperty("id", [Number], b => b.loadable().identifier());
            name = createProperty("name", [String], b => b.loadable());
        }

        class AlbumModel {
            id = createProperty("id", [Number], b => b.loadable().identifier());
            name = createProperty("name", [String], b => b.loadable());
            authorId = createProperty("authorId", [Number], b => b.loadable());
            author = createProperty("author", [AuthorModel], b => b.loadable(["optional"]).identifiedBy(this.authorId));
        }

        const authorSentByServer: TypedInstance<AuthorModel> = {
            id: 2,
            name: "Kaminanda",
        };

        const albumSentByServer: TypedInstance<AlbumModel> = {
            authorId: authorSentByServer.id,
            id: 1,
            name: "Liminal Spaces",
        };

        const querySentByClient: TypedQuery<AlbumModel> = {
            criteria: [{ authorId: [{ op: "in", values: new Set([1]) }] }],
            model: [AlbumModel],
            options: createAlwaysReducible(),
            selection: {
                author: true,
            },
        };

        const albumPayload: Payload<AlbumModel> = {
            items: [albumSentByServer],
            query: {
                model: [AlbumModel],
                criteria: [],
                options: createAlwaysReducible(),
                selection: {},
            },
        };

        /**
         * [Client]
         * the client sends its query to the server, e.g.
         * const data = await service.query(querySentByClient)
         */

        /**
         * [Server]
         * the server receives the query and now keeps track of all the "open" queries, which are the queries it has not yet loaded.
         */
        let openQueries = [querySentByClient];

        /**
         * [Server]
         * the server has now received its first payload from service A - the album, which is still missing its author relation.
         */
        const openQueriesAfterAlbumPayload = reduceQueries(openQueries, [albumPayload.query]);

        if (!openQueriesAfterAlbumPayload) {
            return fail("something went terribly wrong");
        }

        /**
         * [Server]
         * since we now have the album loaded, we'll update our "open" queries to contain only queries that still need to be executed.
         */
        openQueries = openQueriesAfterAlbumPayload;

        /**
         * [Server]
         * service A has emitted all its data. In the open queries we can see that the author is still missing:
         */

        // const albumAuthorHydrationPayload : Payload<AuthorModel> = {

        // };

        // const openQueriesAfterAuthorPayload = reduceQueries(openQueries, [authorSentByServer])
    });

    /**
     * demonstration of a component that receives data from streams in various packets,
     * needs to understand what it has to hydrate on its own.
     */
    it("data-streaming-concept playground", done => {
        interface Payload<T> {
            query: TypedQuery<T>;
            items: TypedInstance<T>[];
        }

        // include author reference
        const selection = new TypedSelector([CanvasModel])
            .select(canvas => canvas.author)
            .select(canvas => canvas.shapes)
            .get();

        // [todo] without thinking, i thought TypedQuery was an interface instead of a class
        // makes me rethink if queries really need to be classes
        const querySentByClient: TypedQuery<CanvasModel, typeof selection> = {
            criteria: [{ authorId: [{ op: "in", values: new Set([1]) }] }],
            model: [CanvasModel],
            options: createAlwaysReducible(),
            selection,
        };

        const canvasStream$ = new Subject<Payload<CanvasModel>>();
        const canvasAuthorHydrationStream$ = new Subject<Payload<CanvasModel>>();

        const canvas: TypedInstance<CanvasModel> = {
            id: 1,
            name: "Canvas_Author_1",
            authorId: 2,
        };

        const canvasShapes: TypedInstance<Shape>[] = [
            {
                id: 10,
                type: "circle",
                radius: 7,
            },
            {
                id: 11,
                type: "square",
                length: 5,
            },
            {
                id: 12,
                type: "triangle",
                angleA: 90,
                angleB: 45,
                angleC: 45,
            },
        ];

        const canvasAuthor: TypedInstance<AuthorModel> = {
            id: 2,
        };

        let openQueries: Query[] = [querySentByClient];

        canvasStream$.pipe(reduce((acc, value) => [...acc, value], [] as Payload<CanvasModel>[]));

        canvasStream$.subscribe(
            data => {
                const reducedQueries = reduceQueries(openQueries, [data.query]);

                if (reducedQueries) {
                    openQueries = reducedQueries;
                }
            },
            error => fail(error),
            () => {
                console.log(JSON.stringify(openQueries));
                done();
            }
        );

        // first emit - canvas only
        canvasStream$.next({
            items: [{ ...canvas }],
            query: {
                criteria: [{ authorId: [{ op: "in", values: new Set([1]) }] }],
                model: [CanvasModel],
                options: createAlwaysReducible(),
                selection: {},
            },
        });

        // second emit, some time later: canvas with shapes. this will we the last emit, so the author is still missing
        // and needs to be hydrated using another stream
        canvasStream$.next({
            items: [
                {
                    ...canvas,
                    shapes: canvasShapes.map(shape => ({ ...shape })),
                },
            ],
            query: {
                criteria: [{ authorId: [{ op: "in", values: new Set([1]) }] }],
                model: [CanvasModel],
                options: createAlwaysReducible(),
                selection: {
                    shapes: true,
                },
            },
        });

        canvasStream$.complete();
    });
});
