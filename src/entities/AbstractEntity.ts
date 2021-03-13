import {Guid} from "guid-typescript";
import DecoratorTool from "../tools/DecoratorTool";
import {ExpresionBuilder} from "../tools/ExpresionBuilder";
import Condition from "../tools/Condition";

export default class AbstractEntity {

    private id: string;
    private createdDate = new Date();
    private fieldOrderNumber: number;

    //TODO This ignoreId, create decorator for this
    constructor(ignoreIdGeneration = false, id: string | undefined = undefined) {

        if (id) {
            this.id = id;
        } else if (!ignoreIdGeneration) {
            this.id = Guid.create().toString();
        }
    }

    public asObject(): {} {
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

    public exp(): ExpresionBuilder {
        return new ExpresionBuilder();
    }

    get Id(): string {
        return this.id;
    }

    set Id(value: string) {
        this.id = value;
    }

    get CreatedDate(): Date {
        return this.createdDate;
    }

    set CreatedDate(value: Date) {
        this.createdDate = value;
    }

    get FieldOrderNumber(): number {
        return this.fieldOrderNumber;
    }

    set FieldOrderNumber(value: number) {
        this.fieldOrderNumber = value;
    }
}
