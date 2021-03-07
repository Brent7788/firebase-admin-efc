import DecoratorTool from "./DecoratorTool";
import TestEntity from "../test/TestEntity";
import Condition from "./Condition";


export default class Convert {

    private static obj: any;

    public static objectTo<T>(object: any, entity: any): T {

        let objectValues = DecoratorTool.getMyPropertyDecoratorValues(entity.constructor, "ObjectField");
        let ignoreField = DecoratorTool.getMyPropertyDecoratorValues(entity.constructor, "IgnoreField");

        console.log("What",objectValues, ignoreField);

        console.log(object, entity)
        for (const objectValue of objectValues) {

            if (Condition.hasSomeValue(object[objectValue.field])) {
                // @ts-ignore
                object[objectValue.field] = Convert.objectTo(object[objectValue.field], new objectValue.type());
            }
        }


        return Object.assign(entity, object);
    }
}