import { PropertyBase } from "./property";

export type PropertyValue<P>
    = P extends PropertyBase<any, any, any, any> ? ReturnType<P["read"]> : never;

export type PropertyIsCreatable<P>
    // = P extends PropertyBase<any, any, any, ["creatable"]> ? true : false;
    // = P extends PropertyBase<any, any, any, infer F> ? ["creatable"] extends F  ? true : false : false;
    = P extends PropertyBase<any, any, any, infer F> ? ["creatable"] extends F ? true : false : false;

export type OptionalPropertyKeys<T> = Exclude<({
    [K in keyof T]: undefined extends T[K] ? (T[K] extends PropertyBase<any, any, any, any> | undefined ? K : never) : never;
})[keyof T], undefined>;


export type OptionalInstance<T> = {
    [K in OptionalPropertyKeys<T>]?: T[K] extends PropertyBase<any, any, any, any> | undefined ? PropertyValue<T[K]> : never;
};

export type RequiredPropertyKeys<T> = Exclude<({
    [K in keyof T]: T[K] extends PropertyBase<any, any, any, any> ? K : never;
})[keyof T], undefined>;

export type RequiredInstance<T> = {
    [K in RequiredPropertyKeys<T>]: T[K] extends PropertyBase<any, any, any, any> ? PropertyValue<T[K]> : never;
};


export type Instance<T> = RequiredInstance<T> & OptionalInstance<T>;


export type OptionalCreatablePropertyKeys<T> = Exclude<({
    [K in keyof T]: undefined extends T[K] ? true extends PropertyIsCreatable<T[K]> ? K : never : never;
})[keyof T], undefined>;

export type OptionalCreatableInstance<T> = {
    [K in OptionalCreatablePropertyKeys<T>]?: T[K] extends PropertyBase<any, any, any, any> | undefined ? PropertyValue<T[K]> : never;
};

export type RequiredCreatablePropertyKeys<T> = Exclude<({
    [K in keyof T]: undefined extends T[K] ? never : true extends PropertyIsCreatable<T[K]> ? K : never;
})[keyof T], undefined>;

export type RequiredCreatableInstance<T> = {
    [K in RequiredCreatablePropertyKeys<T>]: T[K] extends PropertyBase<any, any, any, any> ? PropertyValue<T[K]> : never;
};

export type CreatableInstance<T> = OptionalCreatableInstance<T> & RequiredCreatableInstance<T>;
