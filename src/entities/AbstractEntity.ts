import {Guid} from "guid-typescript";
import DecoratorTool from "../tools/DecoratorTool";
import {ExpresionBuilder} from "../tools/ExpresionBuilder";
import Condition from "../tools/Condition";

export default class AbstractEntity {

    private _id: string;
    private _createdDate = new Date();
    private _fieldOrderNumber: number;

    //TODO This ignoreId, create decorator for this
    constructor(ignoreIdGeneration = false, id: string | undefined = undefined) {

        if (id) {
            this._id = id;
        } else if (!ignoreIdGeneration) {
            this._id = Guid.create().toString();
        }
    }

    public asObjectOld(): {} {

        this.validate();

        let object = Object.assign({}, this);

        let ignoreValues = DecoratorTool.getMyPropertyDecoratorValues(this.constructor, "IgnoreField");

        for (const ignoreValue of ignoreValues) {
            // @ts-ignore
            delete object[ignoreValue];
        }

        let objectValues = DecoratorTool.getMyPropertyDecoratorValues(this.constructor, "ObjectField");

        for (const objectValue of objectValues) {

            // @ts-ignore
            if (Condition.hasSomeValue((object[objectValue.field]))) {
                // @ts-ignore
                object[objectValue.field] = object[objectValue.field].asObject();
            }
        }

        return object;
    }

    public asObject(): {} {

        this.validate();

        const object = <any>Object.assign({}, this);
        const objectKeys = Object.keys(object);

        const ignoreValues = DecoratorTool.getMyPropertyDecoratorValues(this.constructor, "IgnoreField");

        for (const ignoreValue of ignoreValues) {
            delete object[ignoreValue];
        }

        objectKeys.forEach(key => {
            this.handleInnerObject(object, key);
        });

        return object;
    }

    private handleInnerObject(object: any, key: string): void {
        const isObject = typeof object[key] === "object" &&
            Condition.isNotUndefined(object[key]) &&
            Condition.isNotNull(object[key]);

        const haveUnderscore = Condition.stringContain(key,"_");

        if (isObject && object[key].isValueObject && object[key].isValueObject()) {

            this.extractValueObjectAsField(object, key, haveUnderscore);

        } else if (isObject && haveUnderscore && object[key].asObject) {

            object[key.replace("_","")] = object[key].asObject();
            delete object[key];

        } else if (isObject && object[key].asObject) {
            object[key] = object[key].asObject();

        } else if (haveUnderscore) {
            object[key.replace("_","")] = object[key];
            delete object[key];
        }
    }

    private extractValueObjectAsField(object: any, key: string, haveUnderscore: boolean): void {

        if (haveUnderscore) {
            object[key.replace("_","")] = object[key].value;
            delete object[key];
            return;
        }

        object[key] = object[key].value;
    }

    protected validate(): void {}

    public exp(): ExpresionBuilder {
        return new ExpresionBuilder();
    }

    get id(): string {
        return this._id;
    }

    set id(value: string) {
        this._id = value;
    }
    get createdDate(): Date {
        return this._createdDate;
    }

    set createdDate(value: Date) {
        this._createdDate = value;
    }
    get fieldOrderNumber(): number {
        return this._fieldOrderNumber;
    }

    set fieldOrderNumber(value: number) {
        this._fieldOrderNumber = value;
    }
}
