import firebase from "firebase-admin";
import Query = firebase.firestore.Query;
import DocumentData = firebase.firestore.DocumentData;
import AbstractEntity from "./entities/AbstractEntity";
import ObservableEntity from "./tools/ObservableEntity";
import Condition from "./tools/Condition";
import DocumentSnapshot = firebase.firestore.DocumentSnapshot;
import Convert from "./tools/Convert";

export default class DbSetResult<T extends AbstractEntity> {

    private readonly type: (new () => T);
    private entity: T;
    private queries: Query<DocumentData>[] = [];
    private _take: number | undefined;
    private _startAt: number | undefined;

    public observableEntities: ObservableEntity<T>[];

    constructor(type: (new () => T),
                entity: T,
                queries: Query<DocumentData>[],
                observableEntities: ObservableEntity<T>[]) {
        this.type = type;
        this.entity = entity;
        this.queries = queries;
        this.observableEntities = observableEntities;
    }

    public take(take: number): DbSetResult<T> {
        this._take = take;
        return this;
    }

    public startAt(skip: number): DbSetResult<T> {
        this._startAt = skip;
        return this;
    }

    public async firstAsync(): Promise<T> {
        const entity = await this.firstOrDefaultAsync();

        if (Condition.isUndefined(entity)) {
            throw new Error("Unable to find first document");
        }

        return <T>entity;
    }

    public async firstOrDefaultAsync(): Promise<T | undefined> {

        let entity: T | undefined = undefined;

        for (const query of this.queries) {
            const querySnapshot = await query.get();
            if (!querySnapshot.empty) {
                entity = this.setObservableEntity(querySnapshot.docs[0]);
            }

            if (Condition.isNotUndefined(entity)) {
                break;
            }
        }

        return entity;
    }

    public async toListAsync(): Promise<T[]> {

        const entities: T[] = [];

        for (let query of this.queries) {

            if (this._startAt)
                query = query.startAt(this._startAt);

            if (this._take)
                query = query.limit(this._take);

            const querySnapshot = await query.get()

            for (const doc of querySnapshot.docs) {
                entities.push(this.setObservableEntity(doc))
            }

            console.log(querySnapshot.size === this._take);

            if (this._take && querySnapshot.size === this._take) {
                break;
            } else if (this._take) {
                this._take = this._take - querySnapshot.size;
            }
        }

        this.queries = [];
        return entities;
    }

    private setObservableEntity(doc: DocumentSnapshot): T {
        const observableEntity =
            new ObservableEntity<T>(Convert.objectTo<T>(doc.data(), new this.type()));

        this.observableEntities.push(observableEntity);
        return observableEntity.getObserveEntity();
    }
}