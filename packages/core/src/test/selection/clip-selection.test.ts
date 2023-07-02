import { UnpackedEntitySelection } from "../../lib/common/unpacked-entity-selection.type";
import { EntitySelectionTools } from "../../lib/query/entity-selection-tools";
import { ClippedEntitySelection } from "../../lib/query/entity-selection-tools.interface";

describe("selection: clip", () => {
    interface Entity {
        id: number;
        foo: {
            id: number;
            bar: {
                id: number;
                baz: {
                    id: number;
                };
            };
        };
        khaz: {
            name: string;
            mo: {
                name: string;
                dan: {
                    name: string;
                };
            };
        };
    }

    const tools = new EntitySelectionTools();

    it("should work #1", () => {
        // arrange
        const what: UnpackedEntitySelection<Entity> = { foo: { id: true, bar: { id: true } } };
        const by: UnpackedEntitySelection<Entity> = { foo: { id: true } };
        const expected: ClippedEntitySelection[] = [[["foo", "bar"], { id: true }]];

        // act
        const actual = tools.clip(what, by);

        // assert
        expect(actual).toEqual(expected);
    });

    it("should work #2", () => {
        // arrange
        const what: UnpackedEntitySelection<Entity> = { foo: { bar: { id: true, baz: { id: true } } } };
        const by: UnpackedEntitySelection<Entity> = { foo: { bar: { id: true } } };
        const expected: ClippedEntitySelection[] = [[["foo", "bar", "baz"], { id: true }]];

        // act
        const actual = tools.clip(what, by);

        // assert
        expect(actual).toEqual(expected);
    });

    it("should work #3", () => {
        // arrange
        const what: UnpackedEntitySelection<Entity> = {
            foo: { bar: { id: true, baz: { id: true } } },
            khaz: { mo: { name: true } },
        };
        const by: UnpackedEntitySelection<Entity> = { foo: { bar: { id: true } } };
        const expected: ClippedEntitySelection[] = [
            [["foo", "bar", "baz"], { id: true }],
            [["khaz"], { mo: { name: true } }],
        ];

        // act
        const actual = tools.clip(what, by);

        // assert
        expect(actual).toEqual(expected);
    });
});
