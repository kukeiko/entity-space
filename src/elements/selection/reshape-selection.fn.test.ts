import { describe, expect, it } from "vitest";
import { EntitySelection, PackedEntitySelection } from "./entity-selection";
import { reshapeSelection } from "./reshape-selection.fn";

describe(reshapeSelection, () => {
    it("should work", () => {
        // arrange
        const shape: PackedEntitySelection = { id: true, artist: true, album: { id: true, name: true } };
        const selection: EntitySelection = {
            id: true,
            artist: { id: true, name: true },
            album: { id: true, artist: true },
        };
        const expected: PackedEntitySelection = { id: true, artist: true, album: { id: true } };

        // act
        const actual = reshapeSelection(shape, selection);

        // assert
        expect(actual).toEqual(expected);
    });
});
