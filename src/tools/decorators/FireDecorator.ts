import "reflect-metadata";

/* This will prevent field from being save/store in firebase database
* */
export function IgnoreField(): PropertyDecorator {
    return function (target: Object, key: string | symbol) {
        createMetadata(key, target, "IgnoreField");
    }
}

/* This will convert field into object
* */
export function ObjectField<T>(type: (new () => T)): PropertyDecorator {
    return function (target: Object, key: string | symbol) {
        createMetadata((<string>key).replace("_", ""), target, "ObjectField", type);
    }
}

/* Check if class have file, the save in to firebase storage
* */
export function FileField(): PropertyDecorator {
    return function (target: Object, key: string | symbol) {
        createMetadata(key, target, "FileField");
    }
}

/* This will convert field into object
* */
export function DbSet(): PropertyDecorator {
    return function (target: Object, key: string | symbol) {
        createMetadata(key, target, "DbSet");
    }
}

function createMetadata(key: string | symbol, target: Object, keyLabel: string, type: any | undefined = undefined): void {

    let metadataValue;

    if (type) {
        metadataValue = {
            field: key,
            type: type
        }
    } else {
        metadataValue = key;
    }

    // original functionality
    Reflect.defineMetadata(
        `data:${keyLabel}`,
        metadataValue,
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