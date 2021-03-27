import {Guid} from "guid-typescript";
import DecoratorTool from "../tools/DecoratorTool";
import {ExpresionBuilder} from "../tools/ExpresionBuilder";
import Condition from "../tools/Condition";

export default class AbstractEntity {

    private _id: string;
    private _createdDate = new Date();
    private _documentPosition: number;

    //TODO This ignoreId, create decorator for this
    constructor(ignoreIdGeneration = false, id: string | undefined = undefined) {

        if (id) {
            this._id = id;
        } else if (!ignoreIdGeneration) {
            this._id = Guid.create().toString();
        }
    }

    public asObject(ignoreValidation = false): {} {

        if (!ignoreValidation)
            this.validate();

        const object = <any>Object.assign({}, this);

        this.deleteFieldsWithIgnoreDecorator(object);

        const objectKeys = Object.keys(object);

        objectKeys.forEach(key => {
            this.handleInnerObject(object, key, ignoreValidation);
        });

        return object;
    }

    private deleteFieldsWithIgnoreDecorator(object: any) {
        const ignoreValues = DecoratorTool.getMyPropertyDecoratorValues(this.constructor, "IgnoreField");

        for (const ignoreValue of ignoreValues) {
            delete object[ignoreValue];
        }
    }

    private handleInnerObject(object: any, key: string, ignoreValidation: boolean): void {
        const isObject = typeof object[key] === "object" &&
            Condition.isNotUndefined(object[key]) &&
            Condition.isNotNull(object[key]);

        const haveUnderscore = Condition.stringContain(key,"_");

        if (isObject && object[key].isValueObject && object[key].isValueObject()) {

            this.extractValueObjectAsField(object, key, haveUnderscore);

        } else if (isObject && haveUnderscore && object[key].asObject) {

            object[key.replace("_","")] = object[key].asObject(ignoreValidation);
            delete object[key];

        } else if (isObject && object[key].asObject) {
            object[key] = object[key].asObject(ignoreValidation);

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
    get documentPosition(): number {
        return this._documentPosition;
    }

    set documentPosition(value: number) {
        this._documentPosition = value;
    }
}
