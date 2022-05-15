export function chip(subject: string, separator: string): [string, string | undefined] {
    const index = subject.indexOf(separator);

    if (index < 0) {
        return [subject, void 0];
    }

    return [subject.substring(0, index), subject.substring(index + 1) || void 0];
}
