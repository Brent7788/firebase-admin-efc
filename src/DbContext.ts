import firebase from "firebase-admin";
import DbSet from "./DbSet";
import AbstractEntity from "./entities/AbstractEntity";
import EmulatorConfig from "./entities/EmulatorConfig";

let canConfigEmulator = true;

export default class DbContext {

    private readonly db;
    public auth = firebase.auth();
    private batch;
    private dbSetFieldNames: string[] = [];
    private fetchTimeOut = 3000;
    private check: any;
    private longRunningThread = false;
    private readonly addPagination: boolean;
    private entitySetCount = 0;

    public writeError = false;

    constructor(addPagination = false, emulatorConfig: EmulatorConfig | undefined = undefined) {
        this.addPagination = addPagination;

        /*if (emulatorConfig && canConfigEmulator) {
            if (emulatorConfig.firestorePort) {
                firebase.firestore().useEmulator(emulatorConfig.localhost, emulatorConfig.firestorePort);
            }

            if (emulatorConfig.authPort) {
                firebase.auth().useEmulator(`http://${emulatorConfig.localhost}:${emulatorConfig.authPort}`);
            }

            canConfigEmulator = false;
        }*/

        this.db = firebase.firestore();
        this.batch = this.db.batch();
        this.auth = firebase.auth();
    }

    protected initializeDbFireStore(types: (new () => any)[]): void {
        if (types) {
            for (const type of types) {
                let entity = new type();
                const dbSetFieldName = this.lowercaseFirstLetter(entity.constructor.name);
                (<any>this)[dbSetFieldName] = new DbSet(type, entity, this.db, this.batch);
                this.dbSetFieldNames.push(dbSetFieldName);
            }
        }
    }

    public async set<T extends AbstractEntity>(entity: T | undefined, ignoreValidation = false) {

        this.validateEntityBeforeWrite(entity);

        const entityName = (<T>entity).constructor.name;

        if (this.addPagination) {
            this.entitySetCount++;
            (<T>entity).documentPosition = await this.getLastDocumentPosition(entityName);
        }

        const ref = this.db.collection((<T>entity).constructor.name)
            .doc((<T>entity).id);

        this.batch.set(ref, (<T>entity).asObject(ignoreValidation));
    }

    private update<T extends AbstractEntity>(entity: T | undefined): void {

        this.validateEntityBeforeWrite(entity);

        const ref = this.db.collection((<T>entity).constructor.name)
            .doc((<T>entity).id);

        this.batch.update(ref, (<T>entity).asObject());
    }

    public delete<T extends AbstractEntity>(entity: T | undefined): void {

        this.validateEntityBeforeWrite(entity);

        const ref = this.db.collection((<T>entity).constructor.name)
            .doc((<T>entity).id);

        this.batch.delete(ref);
    }

    //TODO Use a tracking system: https://docs.microsoft.com/en-us/ef/core/querying/tracking
    public async saveChangesAsync() {

        try {
            if (this.writeError) {
                console.log("Unable to save changes. There was an error on the DB context.")
                return;
            }

            const dbSets = this.getDbSets().filter(dbSet => dbSet);

            if (dbSets.length === 0)
                throw new Error("There is no entities to save");

            await this.updateObservableEntities(dbSets);

            return this.batch.commit();
        } catch (error) {
            throw new Error(error.message)
        } finally {
            this.batch = this.db.batch();
            this.entitySetCount = 0;
        }
    }

    private getDbSets(): DbSet<any>[] {
        return this.dbSetFieldNames.map(dbSetFieldName => <DbSet<any>>(<any>this)[dbSetFieldName]);
    }

    private async updateObservableEntities(dbSets: DbSet<any>[]) {
        const entitiesToUpdate = dbSets
            .map(dbSet => dbSet.observableEntities.filter(o => o.haveEntityChanged))
            .flat();

        let updateAsPromises = [];

        for (const entitiesToUpdateElement of entitiesToUpdate) {
            updateAsPromises.push(this.update(entitiesToUpdateElement.entity));
        }

        await Promise.all(updateAsPromises);
    }

    private validateEntityBeforeWrite<T extends AbstractEntity>(entity: T | undefined) {
        if (!entity) {
            this.writeError = true;
            //TODO Improve error message
            throw new Error(`Please provide entity to write`);
        }

        if (!entity.id) {
            this.writeError = true;
            throw new Error(`Entity(${(<T>entity).constructor.name}) doesn't have unique identifier(id)`);
        }
    }

    private lowercaseFirstLetter(str: any): string {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }

    public async getLastDocumentPosition(entityName: string): Promise<number> {
        try {
            const collectionReference = this.db.collection(entityName);
            const querySnapshot = await collectionReference
                .orderBy("documentPosition")
                .limitToLast(1)
                .get();

            if (this.entitySetCount > 1 && querySnapshot.empty) {
                return this.entitySetCount;
            }

            if (querySnapshot.empty) {
                return 1;
            }

            const entity = querySnapshot.docs[0].data();

            if (entity.documentPosition === undefined ||
                entity.documentPosition === null ||
                isNaN(entity.documentPosition)) {

                throw new Error(`Entity with id: ${entity.id} field order number is undefined, null or NaN`);
            }

            if (this.entitySetCount > 1) {
                return ++entity.documentPosition + (this.entitySetCount - 1);
            }

            return ++entity.documentPosition;
        } catch (error) {
            this.writeError = true;
            console.error("Unable to process pagination", error);
            throw new Error(`Unable to process pagination ${error}`);
        }
    }
}