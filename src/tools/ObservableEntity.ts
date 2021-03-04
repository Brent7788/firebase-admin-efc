import AbstractEntity from "../entities/AbstractEntity";
import onChange from "on-change";

export default class ObservableEntity<T extends AbstractEntity> {

    public entity: T;
    public haveEntityChanged = false;

    constructor(entity: T) {
        this.entity = entity;
    }

    public getObserveEntity() {
        return onChange(this, function (path, value, previousValue, name) {
            if (!this["haveEntityChanged"])
                this["haveEntityChanged"] = true;

            console.log("Entity value cahnged", value, path);
            /*console.log('Object changed:');
            console.log('path:', path);
            console.log('value:', value);
            console.log('previousValue:', previousValue);
            console.log('name:', name);*/
        }).entity;
    }
}
