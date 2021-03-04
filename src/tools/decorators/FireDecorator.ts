import "reflect-metadata";

//TODO All of these decorator do the same

/* This will prevent field from being save/store in firebase database
* */
export function IgnoreField(): PropertyDecorator {
    return function (target: Object, key: string | symbol) {
        createMetadata(key, target, "IgnoreField");
    }
}

/* This will convert field into object
* */
export function ObjectField(): PropertyDecorator {
    return function (target: Object, key: string | symbol) {
        createMetadata(key, target, "ObjectField");
    }
}

/* This will convert field into object
* */
export function DbSet(): PropertyDecorator {
    return function (target: Object, key: string | symbol) {
        createMetadata(key, target, "DbSet");
    }
}

function createMetadata(key: string | symbol, target: Object, keyLabel: string): void {

    // original functionality
    Reflect.defineMetadata(
        `data:${keyLabel}`,
        key,
        target,
        key
    );

    // new functionality
    let propertyKeys =
        Reflect.getOwnMetadata("keys:" + keyLabel, target) ||
        (Reflect.getMetadata("keys:" + keyLabel, target) || []).slice(0);

    Reflect.defineMetadata("keys:" + keyLabel, propertyKeys, target);

    // record new property key
    propertyKeys.push(key);
}