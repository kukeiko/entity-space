export function scanString(delimiter: string, iterator: IterableIterator<string>): [string, IteratorResult<string>] {
    let char = delimiter;
    let buffer = char;
    let next = iterator.next();

    while (!next.done) {
        char = next.value;
        buffer += char;

        if (char === delimiter) {
            return [buffer, next];
        }

        next = iterator.next();
    }

    throw new Error(`string did not close`);
}
