import firebase from "firebase-admin";
import Query = firebase.firestore.Query;
import DocumentData = firebase.firestore.DocumentData;
import AbstractEntity from "./entities/AbstractEntity";
import ObservableEntity from "./tools/ObservableEntity";
import Condition from "./tools/Condition";
import DocumentSnapshot = firebase.firestore.DocumentSnapshot;
import Convert from "./tools/Convert";
import {firestore} from "firebase-admin/lib/firestore";
import QuerySnapshot = firestore.QuerySnapshot;

export default class DbSetResult<T extends AbstractEntity> {

    private readonly type: (new () => T);
    private entity: T;
    private readonly queries: Query<DocumentData>[] = [];
    private _take: number | undefined;
    private _startAt: number | undefined;
    private _limitReads: number | undefined;
    private readonly textToSearch: string | undefined;

    public observableEntities: ObservableEntity<T>[];

    constructor(type: (new () => T),
                entity: T,
                queries: Query<DocumentData>[],
                observableEntities: ObservableEntity<T>[],
                textToSearch: string | undefined) {
        this.type = type;
        this.entity = entity;
        this.queries = queries;
        this.observableEntities = observableEntities;
        this.textToSearch = textToSearch;
    }

    public take(take: number): DbSetResult<T> {
        this._take = take;
        return this;
    }

    public startAt(skip: number): DbSetResult<T> {
        this._startAt = skip;
        return this;
    }

    public limitReads(limit: number) {
        this._limitReads = limit;
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

        const entitiesAsPromises = [];

        for (let query of this.queries) {

            query = this.queryPosition(query);

            const querySnapshot = await query.get()

            entitiesAsPromises.push(this.getObservableEntitiesFromQuerySnapshot(querySnapshot));

            if ((this._take && querySnapshot.size === this._take) || Condition.hasSomeValue(this.textToSearch)) {
                break;
            } else if (this._take) {
                this._take = this._take - querySnapshot.size;
            }
        }

        return (await Promise.all(entitiesAsPromises)).flat();
    }

    private queryPosition(query: Query<DocumentData>) {
        if (this._startAt)
            query = query.startAt(this._startAt);

        const textToSearchExist = Condition.hasSomeValue(this.textToSearch);

        if (this._take && !textToSearchExist)
            query = query.limit(this._take);

        if (textToSearchExist && Condition.hasSomeValue(this._limitReads)) {
            query = query.limit(<number>this._limitReads);
        }

        return query;
    }

    private async getObservableEntitiesFromQuerySnapshot(querySnapshot: QuerySnapshot<DocumentData>) {

        const observableEntities: T[] = [];

        if (Condition.isStringNotEmpty(this.textToSearch))
            return this.searchDocumentsForText(querySnapshot);

        for (const doc of querySnapshot.docs) {
            observableEntities.push(this.setObservableEntity(doc))
        }

        return observableEntities;
    }

    private async searchDocumentsForText(querySnapshot: QuerySnapshot<DocumentData>) {
        const observableEntities: T[] = [];

        for (const doc of querySnapshot.docs) {

            if (doc.exists && this.searchObject(doc.data()))
                observableEntities.push(this.setObservableEntity(doc));

            if (this._take === observableEntities.length)
                break;
        }

        return observableEntities;
    }

    private searchObject(doc: any): boolean {
        const docKeys = Object.keys(doc).filter(k => k !== "id" && k !== "documentPosition" && k !== "createdDate");

        let textExistInObject = false;

        for (const docKey of docKeys) {

            const value = doc[docKey];

            textExistInObject = this.valueContainsText(value);

            if (textExistInObject)
                break;
        }

        return textExistInObject;
    }

    private valueContainsText(value: any) {

        let containsInValue = false;

        if (Condition.isNotNull(value))
            containsInValue = false;

        if (Array.isArray(value)) {
            containsInValue = this.searchInArray(<[]>value);
        } else if (typeof value === "object") {
            containsInValue = this.searchObject(value);

        } else if (Condition.stringContain(value.toString().toLowerCase(), <string>this.textToSearch)) {
            containsInValue = true;
        }

        return containsInValue;
    }

    private searchInArray(arrayValue: []): boolean {

        let containsInValue = false;

        for (const value of arrayValue) {
            containsInValue = this.valueContainsText(value);
        }

        return containsInValue;
    }


    private setObservableEntity(doc: DocumentSnapshot): T {
        const observableEntity =
            new ObservableEntity<T>(Convert.objectTo<T>(doc.data(), new this.type()));

        this.observableEntities.push(observableEntity);
        return observableEntity.getObserveEntity();
    }
}