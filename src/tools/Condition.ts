export default class Condition {

    constructor() {}

    public static hasSomeValue(val: any) {
        return !this.isNothing(val);
    }

    public static isNothing(val: any) {
        let isNothing = true;

        if (this.isUndefined(val) || this.isNull(val)) return isNothing;

        for (let key in val) {
            if (val.hasOwnProperty(key)) return !isNothing;
        }

        if (typeof val === 'number')
            isNothing = false;

        return isNothing;
    }

    public static isStringNotEmpty(str: string | undefined) {
        return !this.isStringEmpty(str);
    }

    public static isStringEmpty(str: string | undefined) {
        return (str === "" || this.isUndefined(str) || this.isNull(str));
    }

    public static stringContainNot(str: string, containValue:string) {
        return !this.stringContain(str, containValue);
    }

    public static stringContain(str: string, containValue: string) {
        return (this.isStringNotEmpty(str) && this.isStringNotEmpty(containValue) && str.includes(containValue));
    }

    public static isNotUndefined(val: any) {
        return !this.isUndefined(val);
    }

    public static isUndefined(val: any) {
        return (val === undefined);
    }

    public static isNotNull(val: any) {
        return !this.isNull(val);
    }

    public static isNull(val: any) {
        return (val === null);
    }

    public static isNotZero(val: string | number) {
        return !this.isZero(val);
    }

    public static isZero(val: string | number) {
        return (val === 0 || val === "0");
    }
}