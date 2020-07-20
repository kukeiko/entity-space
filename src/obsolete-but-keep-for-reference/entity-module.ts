import { Class } from "../utils";

export function EntityModule(args: { declarations: Class[]; imports?: Class[] }) {
    return <T extends Class>(type: T) => {
        // [todo] do something
    };
}
