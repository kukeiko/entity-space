import { Observable, Subject } from "rxjs";
import { createAlwaysReducible, TypedInstance, TypedQuery, TypedSelector } from "../../src";
import { AuthorModel, CanvasModel, Shape } from "../facade/model";

describe("data-streaming-concept", () => {
    it("playground", done => {
        interface Payload<T> {
            query: TypedQuery<T>;
            items: TypedInstance<T>[];
        }

        // include author reference
        const selection = new TypedSelector([CanvasModel])
            .select(canvas => canvas.author)
            .select(canvas => canvas.shapes)
            .get();

        // [todo] without thinking, i though TypedQuery was an interface instead of a class
        // makes me rethink if queries really need to be classes
        const querySentByClient: TypedQuery<CanvasModel, typeof selection> = {
            criteria: [{ authorId: [{ op: "in", values: new Set([1]) }] }],
            model: [CanvasModel],
            options: createAlwaysReducible(),
            selection,
        };

        const canvasAuthorStream$ = new Subject<Payload<CanvasModel>>();

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

        // first emit - canvas only
        canvasAuthorStream$.next({
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
        canvasAuthorStream$.next({
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

        // canvasAuthorStream$.pip

        function loadFromStream$(stream$: Observable<CanvasModel>, query: TypedQuery<CanvasModel>) {
            // stream$
        }

        done();
    });
});
