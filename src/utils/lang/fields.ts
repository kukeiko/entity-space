// export type FieldKeys<T> = ({ [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K; })[keyof T];
export type Fields<T> = Exclude<{ [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K }[keyof T], undefined>;
