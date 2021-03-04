import Condition from "./Condition";

//TODO Class and functions needs better names
export default class FirestoreTool {

    public operators: string[] = [];
    public conditions: string[] = [];
    public fields: string[] = [];
    public values: string[] = [];

    constructor(pre: string) {
        const spaceReplaced = this.replaceAll(pre.toString(), " ", "");
        const entityFunReplaced = this.replaceAll(spaceReplaced, "\r", "").replace("entity=>", "");
        const breakLineReplaced = this.replaceAll(entityFunReplaced, "\n", "");
        const entityStringReplaces = this.replaceAll(breakLineReplaced, "entity", "");
        console.log(entityFunReplaced);
        this.getFields(entityStringReplaces.split("."));
    }

    private replaceAll(string: string, search: string, replace: string) {
        return string.split(search).join(replace);
    }

    private getFields(rawFields: string[]): void {

        for (const rawField of rawFields) {

            if (rawField != "") {

                if (Condition.stringContain(rawField, "==")) {
                    this.setFirestoreProperties(rawField, "==");
                } else if (Condition.stringContain(rawField, "!=")) {
                    this.setFirestoreProperties(rawField, "!=");
                } else if (Condition.stringContain(rawField, ">")) {
                    this.setFirestoreProperties(rawField, ">");
                } else if (Condition.stringContain(rawField, "<")) {
                    this.setFirestoreProperties(rawField, "<");
                } else if (Condition.stringContain(rawField, ">=")) {
                    this.setFirestoreProperties(rawField, ">=");
                } else if (Condition.stringContain(rawField, "<=")) {
                    this.setFirestoreProperties(rawField, "<=");
                }
            }
        }
    }

    private setFirestoreProperties(rawField: string, operator: string,) {

        let fieldAndValue = rawField.split(operator);
        let conditions = this.setConditions(rawField);
        this.operators.push(operator);
        //Field look like this _surname
        this.fields.push("_" + fieldAndValue[0])

        if (fieldAndValue.length >= 2) {
            const value = conditions ? fieldAndValue[1].replace(conditions, "") : fieldAndValue[1];
            this.values.push(
                this.replaceAll(value, "\"", "")
            );
        }
    }

    private setConditions(rawField: string): string | undefined {
        let and = "&&";
        let or = "||";

        if (Condition.stringContain(rawField, and)) {
            this.conditions.push(and);
            return and;
        } else if (Condition.stringContain(rawField, or)) {
            this.conditions.push(or);
            return or;
        }

        return undefined;
    }
}