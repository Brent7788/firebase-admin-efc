import DecoratorTool from "./DecoratorTool";
import Condition from "./Condition";


export default class Convert {

    public static objectTo<T>(object: any, entity: any): T {

        let objectValues = DecoratorTool.getMyPropertyDecoratorValues(entity.constructor, "ObjectField");

        for (const objectValue of objectValues) {

            if (Condition.hasSomeValue(object[objectValue.field])) {
                object[objectValue.field] = Convert.objectTo(object[objectValue.field], new objectValue.type());
            }
        }


        return Object.assign(entity, object);
    }
}