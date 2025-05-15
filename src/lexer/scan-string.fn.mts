export function scanString(delimiter: string, iterator: IterableIterator<string>): [string, IteratorResult<string>] {
    let char = delimiter;
    let buffer = "";
    let next = iterator.next();
    let nextIsEscaped = false;

    while (!next.done) {
        char = next.value;

        if (char === delimiter && !nextIsEscaped) {
            return [buffer, next];
        }

        nextIsEscaped = char === "\\";

        if (!nextIsEscaped) {
            buffer += char;
        }

        next = iterator.next();
    }

    throw new Error(`string did not close`);
}
