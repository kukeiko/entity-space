import { Fields } from "./fields";

export type PartialFields<T> = Partial<Pick<T, Fields<T>>>;
