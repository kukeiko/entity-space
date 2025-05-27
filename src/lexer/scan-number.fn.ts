const numberRegex = /[0-9]/;

export function scanNumber(char: string, iterator: IterableIterator<string>): [string, IteratorResult<string>] {
    let buffer = char;
    let dotFound = char === ".";
    let next = iterator.next();

    while (!next.done) {
        char = next.value;
        const isDot = char === ".";

        if ((isDot && dotFound) || (!isDot && !numberRegex.test(char))) {
            return [buffer, next];
        }

        dotFound = dotFound || isDot;
        buffer += char;
        next = iterator.next();
    }

    return [buffer, next];
}
