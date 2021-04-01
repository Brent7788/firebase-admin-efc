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

        if (ensureValidState)
            ensureValidState = !(ensureValidState && this._currentStateToIgnore === IgnoreStateCheckOn.All);

        if (ensureValidState)
            this.ensureValidState();

        const object = <any>Object.assign({}, this);

        this.deleteFieldsWithIgnoreDecorator(object);

        const objectKeys = Object.keys(object);

        const validationsToIgnore = DecoratorTool.getMyPropertyDecoratorValues(this.constructor, "Validation");

        console.log("Validation", validationsToIgnore, this._currentStateToIgnore)

        objectKeys.forEach(key => {
            this.handleInnerObject(
                object,
                key,
                validationsToIgnore);
        });

        return object;
    }

    private deleteFieldsWithIgnoreDecorator(object: any) {
        const ignoreValues = DecoratorTool.getMyPropertyDecoratorValues(this.constructor, "IgnoreField");

        for (const ignoreValue of ignoreValues) {
            delete object[ignoreValue];
        }
    }

    private handleInnerObject(object: any,
                              key: string,
                              validationsToIgnore: any[]): void {
        const isObject = typeof object[key] === "object" &&
            Condition.isNotUndefined(object[key]) &&
            Condition.isNotNull(object[key]);

        const haveUnderscore = Condition.stringContain(key, "_");

        if (isObject && object[key].isValueObject && object[key].isValueObject()) {

            this.extractValueObjectAsField(object, key, haveUnderscore, validationsToIgnore);

        } else if (isObject && haveUnderscore && object[key].asObject) {

            object[key]._currentStateToIgnore = this._currentStateToIgnore;
            object[key.replace("_", "")] =
                object[key].asObject(this.checkValidState(validationsToIgnore, key));
            //Delete old field with old key
            delete object[key];
        } else if (isObject && object[key].asObject) {

            object[key]._currentStateToIgnore = this._currentStateToIgnore;
            object[key] = object[key].asObject(this.checkValidState(validationsToIgnore, key));
        } else if (haveUnderscore) {

            object[key.replace("_", "")] = object[key];
            delete object[key];
        }
    }

    private extractValueObjectAsField(object: any,
                                      key: string,
                                      haveUnderscore: boolean,
                                      validationsToIgnore: any[]): void {

        if (this.checkValidState(validationsToIgnore, key))
            object[key].ensureValidState();

        if (haveUnderscore) {
            object[key.replace("_", "")] = object[key].value;
            delete object[key];
            return;
        }

        object[key] = object[key].value;
    }

    private checkValidState(validationsToIgnore: any[], field: string): boolean {

        if (this._currentStateToIgnore === IgnoreStateCheckOn.All)
            return false;

        const validationObject = validationsToIgnore.filter(o => o.field === field);

        let ignoreValidation = validationObject.length !== 0 && validationObject[0].type === this._currentStateToIgnore;

        if (!ignoreValidation)
            ignoreValidation = (validationObject.length !== 0 && validationObject[0].type === IgnoreStateCheckOn.All);

        return !ignoreValidation;
    }

    protected ensureValidState(): void {
        throw new Error(`The ensureValidState function in the ${this.constructor.name} should be overwritten`);
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
