const numEntities = 7000;
const entities = [];

for (let i = 0; i < numEntities; ++i) {
    entities.push({ foo: i, bar: i });
}

// 1
function readIndexValueAsArray(entities) {
    const values = [];

    for (const entity of entities) {
        values.push([entity.foo, entity.bar]);
    }

    return values;
}

readIndexValueAsArray(entities);

// 2
function readIndexValueAsObject(entities) {
    const values = [];

    for (const entity of entities) {
        values.push({ foo: entity.foo, bar: entity.bar });
    }

    return values;
}

readIndexValueAsObject(entities);

// 3
function readIndexValueAsArray_OldschoolLoop(entities) {
    const values = [];

    for (let i = 0; i < entities.length; ++i) {
        values.push([entities[i].foo, entities[i].bar]);
    }

    return values;
}

readIndexValueAsArray_OldschoolLoop(entities);

// 4
function readIndexValueAsObject_OldschoolLoop(entities) {
    const values = [];

    for (let i = 0; i < entities.length; ++i) {
        values.push({ foo: entities[i].foo, bar: entities[i].bar });
    }

    return values;
}

readIndexValueAsObject_OldschoolLoop(entities);

// 5
function readIndexValueAsObject_OldschoolLoop_Path(entities, paths) {
    const values = [];

    for (let i = 0; i < entities.length; ++i) {
        const value = {};

        for (let e = 0; e < paths.length; ++e) {
            const path = paths[e]
            value[path] = entities[i][path];
        }

        values.push(value);
    }

    return values;
}

readIndexValueAsObject_OldschoolLoop_Path(entities, ["foo", "bar"]);

function readIndexValueAsArray_OldschoolLoop_Path(entities, paths) {
    const values = [];

    for (let i = 0; i < entities.length; ++i) {
        const value = [];

        for (let e = 0; e < paths.length; ++e) {
            value.push(entities[i][paths[e]]);
        }

        values.push(value);
    }

    return values;
}

readIndexValueAsArray_OldschoolLoop_Path(entities, ["foo", "bar"]);