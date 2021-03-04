import TestContext from "./test/TestContext";
import TestEntity from "./test/TestEntity";
import 'reflect-metadata';
import 'on-change';

import firebase from "firebase-admin";

const firebaseConfig = {
    apiKey: "AIzaSyBMD1RAOIUVes_0ztO2c0oIjpElwpvL6Ck",
    authDomain: "first-look-talent.firebaseapp.com",
    projectId: "first-look-talent",
    storageBucket: "first-look-talent.appspot.com",
    messagingSenderId: "249876831683",
    appId: "1:249876831683:web:51da092eb11e982203f176"
};

firebase.initializeApp(firebaseConfig);

console.log("-----------------Start---------------");

const t = new TestContext(TestEntity);
const t2 = new TestContext(TestEntity);
const te = new TestEntity;

/*const d = t.testEntity.firstOrDefaultAsync(e => e.exp()
    .equal(() => e.Id, "d22cc458-fc1b-fdf8-23e5-ae155ec33b73")
);*/

te.Name = "Page888";
te.Age = 48;

/*const q = t.testEntity
    .orderByFirstEntry()
    /!*.where(e => e.exp()
        .equal(() => e.Id, "46b28220-ad9f-cafd-a19a-26072e0b5f8a")/!*.and()
        .equal(() => e.Name, "Page2").or()
        .equal(() => e.Age, 44)*!/
    )*!/
    .take(2)
    .startAt(3)
    .toListAsync();

q.then(async (value) => {
    console.log(value);

    const entity = value;

    entity.Name = "IteWoreks";

}).catch(reason => console.log(reason));*/


/*t.testEntity.collectionRef
    .orderBy("fieldOrderNumber")
    //.where("age", "==", 44)
    //.where("name", "in", ["Page2"])
    .limitToLast(1)
    //.startAt(0)
    .get()
    .then(value => {
        value.docs.forEach(value1 => {
            console.log(value1.data())
        })
    });*/


(async function sdf() {
    try {
        await t.set(te);
        await t.saveChangesAsync();

    } catch (error) {
        console.error(error);
    }
})();

//t.expensivelySaveChangesAsync().then().catch(reason => console.error(reason));

console.log("--------------------------------");





