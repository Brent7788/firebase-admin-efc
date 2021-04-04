import {Guid} from "guid-typescript";
import DecoratorTool from "../tools/DecoratorTool";
import {ExpresionBuilder} from "../tools/ExpresionBuilder";
import Condition from "../tools/Condition";
import {IgnoreStateCheckOn} from "./enums/IgnoreStateCheckOn";
import {IgnoreField} from "../tools/decorators/FireDecorator";

export default class AbstractEntity {

    private _id: string;
    private _createdDate = new Date();
    private _documentPosition: number;

    @IgnoreField()
    private _currentStateToIgnore = IgnoreStateCheckOn.Unknown;

    //TODO This ignoreId, create decorator for this
    constructor(ignoreIdGeneration = false, id: string | undefined = undefined) {

        if (id) {
            this._id = id;
        } else if (!ignoreIdGeneration) {
            this._id = Guid.create().toString();
        }
    }

    public asObject(ensureValidState = true): {} {

        const object = <any>Object.assign({}, this);

        if (ensureValidState && this._currentStateToIgnore !== IgnoreStateCheckOn.All)
            this.ensureValidState();

        this.deleteFieldsWithIgnoreDecorator(object);

        const objectKeys = Object.keys(object);

        const validationsToIgnore = this.validationsToIgnore();

        objectKeys.forEach(key => {
            this.handleInnerObject(object, key, validationsToIgnore);
        });

        return object;
    }

    private deleteFieldsWithIgnoreDecorator(object: any) {
        const ignoreValues = DecoratorTool.getMyPropertyDecoratorValues(this.constructor, "IgnoreField");

        for (const ignoreValue of ignoreValues) {
            delete object[ignoreValue];
        }
    }

    private handleInnerObject(object: any, key: string, validationsToIgnore: any[]): void {

        const isObject = typeof object[key] === "object" &&
            Condition.isNotUndefined(object[key]) &&
            Condition.isNotNull(object[key]);

        const haveUnderscore = Condition.stringContain(key, "_");

        if (isObject && object[key].isValueObject && object[key].isValueObject()) {

            this.extractValueObjectAsField(object, key, haveUnderscore);

        } else if (isObject && haveUnderscore && object[key].asObject) {
            object[key]._currentStateToIgnore = this._currentStateToIgnore;
            object[key.replace("_", "")] =
                object[key].asObject(this.ensureObjectIsValidState(validationsToIgnore, key));
            //Delete old field with old key
            delete object[key];
        } else if (isObject && object[key].asObject) {
            object[key]._currentStateToIgnore = this._currentStateToIgnore;
            object[key] = object[key].asObject(this.ensureObjectIsValidState(validationsToIgnore, key));
        } else if (haveUnderscore) {

            object[key.replace("_", "")] = object[key];
            delete object[key];
        }
    }

    private extractValueObjectAsField(object: any, key: string, haveUnderscore: boolean): void {

        if (haveUnderscore) {
            object[key.replace("_", "")] = object[key].value;
            delete object[key];
            return;
        }

        object[key] = object[key].value;
    }

    private ensureObjectIsValidState(validationsToIgnore: any[], key: string): boolean {
        if (validationsToIgnore.length === 0)
            return true;

        const validationToIgnore = validationsToIgnore.filter(v => v.field === key);

        if (validationToIgnore.length === 0)
            return true;

        return this.shouldCheckIfValidState(validationToIgnore[0].type);
    }

    protected ensureValidState(): void {
        this.ensureValueObjectIsValidState();
    }

    private ensureValueObjectIsValidState(): void {
        const validationsToIgnore = this.validationsToIgnore();

        const keys = Object.keys(this).filter(k => validationsToIgnore.filter(v => v.field === k).length === 0);

        keys.forEach(key => this.isValueObjectValidState(this, {
            field: key,
            type: IgnoreStateCheckOn.None
        }));

        validationsToIgnore.forEach(
            validationObject => this.isValueObjectValidState(this, validationObject));
    }

    private isValueObjectValidState(object: any, validationObject: any): void {
        const field = validationObject.field;
        const value = object[field];
        const isSomething = Condition.isNotUndefined(value) && Condition.isNotNull(value);
        const isValueObject = isSomething && value.isValueObject && value.isValueObject();

        if (isSomething && isValueObject && this.shouldCheckIfValidState(validationObject.type)) {
            value.ensureValidState();
        }
    }

    private shouldCheckIfValidState(type: number) {
        if (this._currentStateToIgnore === IgnoreStateCheckOn.All)
            return false;

        let ignoreValidation = type === this._currentStateToIgnore;

        if (!ignoreValidation)
            ignoreValidation = type === IgnoreStateCheckOn.All;

        return !ignoreValidation;
    }

    private validationsToIgnore(): any[] {
        return DecoratorTool.getMyPropertyDecoratorValues(this.constructor, "Validation");
    }

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

    set currentStateToIgnore(currentStateToIgnore: IgnoreStateCheckOn) {
        this._currentStateToIgnore = currentStateToIgnore;
    }
}
