export type SelectEntity<T, E> = undefined extends E
    ? T
    : E extends true
      ? Exclude<T, undefined>
      : T extends Array<infer ItemType>
        ? Array<SelectEntity<ItemType, E>> | Extract<T, null>
        : { [K in keyof (T | E)]-?: SelectEntity<NonNullable<T[K]>, E[K]> | Extract<T[K], null> } & Omit<
              NonNullable<T>,
              keyof E
          >;
