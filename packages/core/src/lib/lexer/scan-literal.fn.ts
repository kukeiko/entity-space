const regex = /[-_a-zA-Z.]/;

export function scanLiteral(char: string, iterator: IterableIterator<string>): [string, IteratorResult<string>] {
    let buffer = char;
    let next = iterator.next();

    while (!next.done) {
        char = next.value;

        if (!regex.test(char)) {
            return [buffer, next];
        }

        buffer += char;
        next = iterator.next();
    }

    return [buffer, next];
}
