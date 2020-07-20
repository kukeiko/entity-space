export type Replace<T, K extends keyof T, V> = Omit<T, K> & Record<K, V>;
