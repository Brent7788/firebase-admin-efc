
declare type Operator = "<" | "<=" | "==" | "!=" | ">=" | ">" | "array-contains" | "in" | "not-in" | "array-contains-any";

export class ExpresionBuilder {

    public conditionState = ConditionState.START;
    public tempExpressions: Expresion[] = [];
    public orExpressions: Expresion[] = []
    public andExpresionGroup: ExpresionGroup[] = [];

    public notEqual(propertyFun: () => any, value: any): ExpresionBuilder {
        this.setUpExpresion(propertyFun, value, "!=");
        return this;
    }

    public equal(propertyFun: () => any, value: any): ExpresionBuilder {
        this.setUpExpresion(propertyFun, value, "==");
        return this;
    }

    public greaterThan(propertyFun: () => any, value: any): ExpresionBuilder {
        this.setUpExpresion(propertyFun, value, ">");
        return this;
    }

    public lessThan(propertyFun: () => any, value: any): ExpresionBuilder {
        this.setUpExpresion(propertyFun, value, "<");
        return this;
    }

    public greaterThanEqual(propertyFun: () => any, value: any): ExpresionBuilder {
        this.setUpExpresion(propertyFun, value, ">=");
        return this;
    }

    public lessThanEqual(propertyFun: () => any, value: any): ExpresionBuilder {
        this.setUpExpresion(propertyFun, value, "<=");
        return this;
    }

    private setUpExpresion(propertyFun: () => any, value: any, operator: Operator): void {

        const tempFieldAndValue = new Expresion(this.conditionState, operator);

        if (this.conditionState === ConditionState.OR) {
            tempFieldAndValue.isStartOfNewGroup = true;
        }

        let lastIndex = this.tempExpressions.length - 1;

        if (this.conditionState === ConditionState.OR &&
            this.tempExpressions.length > 0 &&
            this.tempExpressions[lastIndex].isStartOfNewGroup) {
            this.tempExpressions[lastIndex].isStartOfNewGroup = false;
        }

        this.setField(propertyFun, tempFieldAndValue);
        tempFieldAndValue.value = value;

        this.tempExpressions.push(tempFieldAndValue)

        if (this.tempExpressions.length == 2) {
            this.tempExpressions[0].conditionState = this.conditionState;
        }

        this.conditionState = ConditionState.DONE;
    }

    private setField(propertyFun: () => any, tempFieldAndValue: Expresion): void {
        if (typeof propertyFun === "function") {
            const property = this.replaceAll(propertyFun.toString(), " ", "")
                .replace(";", "")
                .replace("}", "");
            const split = property.split(".")

            console.log("--", split, split.length);
            if (split.length < 2 || split.length > 2)
                throw new Error(`Unable to extract property out of function: ${propertyFun.toString()}`)

            //TODO Mite not be good, I assume all field is lowercase
            tempFieldAndValue.field = (this.lowercaseFirstLetter(split[1]));
        } else {
            tempFieldAndValue.field = (propertyFun);
        }
    }

    private replaceAll(string: string, search: string, replace: string) {
        return string.split(search).join(replace);
    }

    public prosesExpresionSet(): ExpresionBuilder {

        if (this.conditionState !== ConditionState.DONE)
            throw new Error("ExpresionBuilder is in an invalid state")

        if (this.tempExpressions.length == 1) {
            this.orExpressions = this.tempExpressions;
        } else if (this.tempExpressions.length > 1) {

            let andExpressions = new Array<Expresion>();

            this.tempExpressions.forEach((expresion, index) => {

               // console.log(expresion);
                if (expresion.conditionState === ConditionState.AND && !expresion.isStartOfNewGroup) {

                    andExpressions.push(expresion);

                } else if (expresion.conditionState === ConditionState.OR &&
                    expresion.isStartOfNewGroup &&
                    (index + 1) < this.tempExpressions.length) {

                    if (andExpressions.length > 0) {
                        this.andExpresionGroup.push(new ExpresionGroup(andExpressions));
                        andExpressions = [];
                    }
                    expresion.conditionState = ConditionState.AND;
                    andExpressions.push(expresion);

                } else if (expresion.conditionState === ConditionState.OR) {
                    this.orExpressions.push(expresion);
                }
            });

            if (andExpressions.length > 0) {
                this.andExpresionGroup.push(new ExpresionGroup(andExpressions));
            }
        } else {
            throw new Error("No expression was provided");
        }

        return this;
    }

    private lowercaseFirstLetter(str: any): string {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }

    public and(): ExpresionBuilder {
        this.conditionState = ConditionState.AND;
        return this;
    }

    public or(): ExpresionBuilder {
        this.conditionState = ConditionState.OR;
        return this;
    }
}

export class ExpresionGroup {
   public expressions: Expresion[] = [];

   constructor(expressions: Expresion[]) {
       this.expressions = expressions;
   }
}

export class Expresion {
    public conditionState: ConditionState;
    public operator: Operator;
    public isStartOfNewGroup = false;
    public field: string;
    public value: any;

    constructor(conditionState: ConditionState, operator: Operator) {
        this.conditionState = conditionState;
        this.operator = operator;
    }
}

export enum ConditionState {
    START,
    AND,
    OR,
    DONE
}