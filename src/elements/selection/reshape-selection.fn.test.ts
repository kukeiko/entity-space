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

    it("should reshape a recursive selection", () => {
        // arrange
        const shape: PackedEntitySelection = { folders: "*", files: true };
        const selection = { folders: {}, files: { name: true } } satisfies EntitySelection;
        selection.folders = selection;
        const expected: PackedEntitySelection = { folders: "*", files: true };

        // act
        const actual = reshapeSelection(shape, selection);

        // assert
        expect(actual).toEqual(expected);
    });

    it("non-recursive selection part should not reshape using a recursive shape", () => {
        // arrange
        const shape: PackedEntitySelection = { folders: "*", files: true };
        const selection = { folders: { folders: true }, files: { name: true } } satisfies EntitySelection;
        const expected: PackedEntitySelection = { files: true };

        // act
        const actual = reshapeSelection(shape, selection);

        // assert
        expect(actual).toEqual(expected);
    });
});
