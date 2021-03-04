
export default class DecoratorTool {

    public static getMyPropertyDecorator(ctor: { prototype: any }, metadataKey: string, propertyKey: string) {
        return Reflect.getMetadata(
            "data:" + metadataKey,
            ctor.prototype,
            propertyKey
        );
    }

    public static getMyPropertyDecoratorPropertyKeys(ctor: { prototype: any }, metadataKey: string) {
        return (Reflect.getMetadata("keys:" + metadataKey, ctor.prototype) ||
            []) as string[];
    }

    public static getMyPropertyDecorators(ctor: { prototype: any }, metadataKey: string) {
        const ret: Record<string, any> = {};
        for (let propertyKey of this.getMyPropertyDecoratorPropertyKeys(ctor, metadataKey)) {
            ret[propertyKey] = this.getMyPropertyDecorator(ctor, metadataKey, propertyKey);
        }
        return ret;
    }

    public static getMyPropertyDecoratorValues(ctor: { prototype: any }, metadataKey: string) {
        const myPropertyDecorators = this.getMyPropertyDecorators(ctor, metadataKey);
        return Object.keys(myPropertyDecorators).map(
            propertyKey => myPropertyDecorators[propertyKey]
        );
    }
}