import Condition from "../tools/Condition";


export default class ValueOf<TValue> {

    public value: TValue;

    protected constructor() {}

    public static from(value: any | null = null): any {
        const o = new this();
        o.value = value;
        return o;
    }

    protected ensureValidState(): void {
        if (Condition.isNothing(this.value))
            throw new Error(`${this.constructor.name} can not be nothing`)
    }

    public equal(val: ValueOf<TValue>): boolean {
        return this.value === val.value;
    }

    public isValueObject(): boolean {
        return true;
    }
}