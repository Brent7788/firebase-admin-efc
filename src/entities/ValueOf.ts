

export default class ValueOf<TValue> {

    public value: TValue;

    protected constructor() {
    }

    public static from(value: any | undefined = undefined, validate = false): any {
        const o = new this();
        o.value = value;
        if (validate) {
            o.validate();
        }
        return o;
    }

    public validate(): void {}

    public equal(val: ValueOf<TValue>): boolean {
        return this.value === val.value;
    }

    public isValueObject(): boolean {
        return true;
    }
}