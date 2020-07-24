import { select } from "src";
import { ShapeQuery, allShapeModels } from "../facade/model";

describe("union examples", () => {
    it("foo", () => {
        const query = new ShapeQuery({ selection: select(allShapeModels, x => x.area()) });
    });
});
