

export default class ValueOf<TValue> {

    public value: TValue;

    protected constructor() {
    }

    public static from(value: any): any {
        const o = new this();
        o.value = value;
        o.validate();
        return o;
    }

    protected validate(): void {}

    public equal(val: ValueOf<TValue>): boolean {
        return this.value === val.value;
    }

    public isValueObject(): boolean {
        return true;
    }
}