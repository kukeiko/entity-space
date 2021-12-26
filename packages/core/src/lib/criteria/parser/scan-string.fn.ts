export function scanString(delimiter: string, iterator: IterableIterator<string>): [string, IteratorResult<string>] {
    let char = delimiter;
    let buffer = "";
    let next = iterator.next();

    while (!next.done) {
        char = next.value;

        if (char === delimiter) {
            return [buffer, next];
        }

        buffer += char;
        next = iterator.next();
    }

    throw new Error(`string did not close`);
}
