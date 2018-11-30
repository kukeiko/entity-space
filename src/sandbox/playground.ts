interface Metadata {
    type: string;
}

interface Entity {
    $: Metadata;
}

export type Unbox<T> = T extends any[] ? T[number] : T;
export type Box<T, A = T> = A extends any[] ? T[] : T;
export type ExcludeVoid<T> = Exclude<T, void>;
export type ExcludeNullsy<T> = Exclude<T, void | null>;
// export type Expandables<T> = ({ [P in keyof T]-?: T[P] extends Entity[] | undefined ? P : T[P] extends Entity | undefined | null ? P : never; })[keyof T];
export type Expandables<T> = ({ [P in keyof T]: T[P] extends Entity[] | undefined ? P : T[P] extends Entity | undefined | null ? P : never; })[keyof T];
export type Locals<T> = Exclude<keyof T, Expandables<T> | "$">;
export type NullIfNull<T, U> = U extends null ? T | null : T;

export class ExpansionQuery<T> {
    expand<K extends Expandables<T>, E = ExcludeNullsy<T[K]>, X = Unbox<E>, R = X>(k: K, _?: (eq: ExpansionQuery<X>) => ExpansionQuery<R>): ExpansionQuery<Record<K, Box<R, E> | NullIfNull<Box<R, E>, T[K]>> & T> {
        return this as any;
    }

    selectAll(): ExpansionQuery<Record<Locals<T>, Exclude<T[Locals<T>], undefined>> & T> {
        return this as any;
    }

    select<K extends Locals<T>>(k: K): ExpansionQuery<Record<K, Exclude<T[K], undefined>> & T> {
        return this as any;
    }
}

export class RootQuery<T> {
    expand<K extends Expandables<T>, E = ExcludeNullsy<T[K]>, X = Unbox<E>, R = X>(k: K, _?: (eq: ExpansionQuery<X>) => ExpansionQuery<R>): RootQuery<Record<K, Box<R, E> | NullIfNull<Box<R, E>, T[K]>> & T>;
    expand(...args: any[]): any {
        return this as any;
    }

    select<K extends Locals<T>>(k: K): RootQuery<Record<K, Exclude<T[K], undefined>> & T> {
        return this as any;
    }

    execute(): T[] {
        return null as any;
    }
}

interface Address extends Entity {
    city?: string;
    postalCode?: number;
}

class Customer implements Entity {
    $ = { type: "foo" };
    name?: string;
    address?: Address;
    surname?: string;
}

interface Review extends Entity {
    customer?: Customer | null;
    text?: string;
}

interface Product extends Entity {
    name?: string;
    reviews?: Review[];
}

interface Foo extends Entity {
    bar?: Bar;
}

interface Bar extends Entity {
    baz?: Baz | null;
}

interface Baz extends Entity {
    kaz?: Kaz;
}

interface Kaz extends Entity {
    mo?: string;
}

interface Order extends Entity {
    customer?: Customer;
    products?: Product[];
    foo?: Foo | null;
}

let orders = (new RootQuery<Order>())
    .expand("products", q => q.expand("reviews", q => q.expand("customer")))
    // .expand("customer")
    // .expand("customer", q => q.selectAll())
    // .expand("customer", q => q.expand("address", q => q.select("city")))
    .expand("customer", q => q.selectAll().expand("address", q => q.select("city")))
    .expand("foo", q => q.expand("bar", q => q.expand("baz", q => q.expand("kaz"))))
    .execute();

orders.forEach(order => {
    if (order.foo !== null) {
        let fooCheck = order.foo.bar;

        if (order.foo.bar.baz !== null) {
            let bazCheck = order.foo.bar.baz.kaz;
        }
    }

    let x = order.customer.address.city.length;
    let foo = order.customer.surname.length;

    order.products.forEach(product => {
        product.reviews.forEach(review => {
            if (review.customer !== null) {
                let customerCheck = review.customer.name;
            }
        });
    });
});
