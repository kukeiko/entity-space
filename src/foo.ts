type Foo = 3;

export module Foo {

}

type Bar<T> = T extends Foo<any> ? true : false;