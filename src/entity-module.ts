import { Class } from "./lang";

export function EntityModule(args: { declarations: Class[]; imports?: Class[] }) {
    return <T extends Class>(type: T) => {
        // [todo] do something
    };
}
