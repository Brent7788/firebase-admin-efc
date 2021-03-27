import firebase from "firebase-admin";
import AbstractEntity from "./entities/AbstractEntity";
import {ConditionState, Expresion, ExpresionBuilder} from "./tools/ExpresionBuilder";
import CollectionReference = firebase.firestore.CollectionReference;
import DocumentData = firebase.firestore.DocumentData;
import Query = firebase.firestore.Query;
import Firestore = firebase.firestore.Firestore;
import WriteBatch = firebase.firestore.WriteBatch;
import Condition from "./tools/Condition";
import ObservableEntity from "./tools/ObservableEntity";
import DbSetResult from "./DbSetResult";
import DocumentSnapshot = firebase.firestore.DocumentSnapshot;
import Convert from "./tools/Convert";

export default class DbSet<T extends AbstractEntity> {

    private db: Firestore;
    private readonly batch: WriteBatch;
    private readonly entity: T;
    private readonly type: (new () => T);
    private readonly entityName: string;
    private queries: Query<DocumentData>[] = [];
    private readonly DOCUMENT_POSITION = "documentPosition";
    private textToSearch: string | undefined;

    public readonly collectionRef: CollectionReference<DocumentData>;
    public observableEntities: ObservableEntity<T>[] = [];

    constructor(type: (new () => T), entity: T, db: Firestore, batch: WriteBatch) {
        this.type = type;
        this.entity = entity;
        this.entityName = entity.constructor.name;
        this.db = db;
        this.batch = batch;
        this.collectionRef = this.db.collection(this.entityName);
    }


    public where(expresion: (entity: T) => ExpresionBuilder): DbSetResult<T> {
        return this.sanitizeQueries(
            () => this.setQueries(expresion(this.entity).prosesExpresionSet())
        );
    }

    public search(text: string) {
        if (Condition.isStringEmpty(text))
            throw new Error("Please provide some text to search");

        this.textToSearch = text;

        return this.orderByFieldNumber();
    }

    public orderByFieldNumber(): DbSetResult<T> {
        return this.sanitizeQueries(
            () => this.queries.push(this.collectionRef.orderBy(this.DOCUMENT_POSITION))
        );
    }

    public orderBy(fieldPath: string): DbSetResult<T> {
        return this.sanitizeQueries(
            () => this.queries.push(this.collectionRef.orderBy(fieldPath))
        );
    }

    public async firstOrDefaultAsync(expresion: (entity: T) => ExpresionBuilder): Promise<T | undefined> {
        const exp: ExpresionBuilder = expresion(this.entity).prosesExpresionSet();

        if (exp.andExpresionGroup.length === 0 &&
            exp.orExpressions.length === 1 &&
            Condition.stringContain(exp.orExpressions[0].field, "id")) {

            const documentReference = this.collectionRef.doc(exp.orExpressions[0].value);
            const documentSnapshot = await documentReference.get();

            if (!documentSnapshot.exists) {
                return undefined;
            } else {
                const observableEntity = new ObservableEntity<T>(Object.assign(new this.type(), documentSnapshot.data()));
                this.observableEntities.push(observableEntity);
                return observableEntity.getObserveEntity();
            }
        } else {
            this.setQueries(exp);
        }

        return this.firstInQuery();
    }

    public async firstAsync() {

        let entity: T | undefined = undefined;

        if (this.queries.length === 0) {
            const query = this.collectionRef.orderBy(this.DOCUMENT_POSITION).startAt(0).limit(1);
            const querySnapshot = await query.get();

            if (!querySnapshot.empty) {
                entity = this.setObservableEntity(querySnapshot.docs[0]);
            }
        } else {
            entity = await this.firstInQuery();
        }

        if (Condition.isUndefined(entity)) {
            throw new Error("Unable to find first document");
        }

        return <T>entity;
    }

    private sanitizeQueries(queryFunc: () => void) {
        try {
            queryFunc();
            return new DbSetResult<T>(
                this.type,
                this.entity,
                this.queries,
                this.observableEntities,
                this.textToSearch
            );
        } catch (error) {
            throw new Error(error);
        } finally {
            this.queries = [];
            this.textToSearch = undefined;
        }
    }

    private async firstInQuery() {
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

    private setObservableEntity(doc: DocumentSnapshot): T {
        const observableEntity =
            new ObservableEntity<T>(Convert.objectTo<T>(doc.data(), new this.type()));

        this.observableEntities.push(observableEntity);
        return observableEntity.getObserveEntity();
    }

    private setQueries(exp: ExpresionBuilder): void {

        if (exp.conditionState === ConditionState.START && exp.andExpresionGroup.length === 0) {
            this.setOrQueries(exp.orExpressions[0]);
            return;
        }

        if (exp.andExpresionGroup.length > 0 && this.queries.length === 0) {
            let expressions: Expresion[];
            let queryIndex = 0;
            for (const expresionGroup of exp.andExpresionGroup) {

                expressions = expresionGroup.expressions;

                const orderByWhat = expressions.filter(e =>e.operator === "==");

                for (const expressionObj of expressions) {


                    if (this.queries[queryIndex]) {
                        this.queries[queryIndex] = this.queries[queryIndex].where(expressionObj.field, expressionObj.operator, expressionObj.value);
                    } else if(orderByWhat.length === expressions.length) {
                        this.queries[queryIndex] = this.collectionRef.orderBy(this.DOCUMENT_POSITION).where(expressionObj.field, expressionObj.operator, expressionObj.value);
                    } else {
                        this.queries[queryIndex] = this.collectionRef.orderBy(expressionObj.field).where(expressionObj.field, expressionObj.operator, expressionObj.value);
                    }
                }
                queryIndex++;
            }
        }

        if (exp.orExpressions.length > 0) {
            for (const orExpression of exp.orExpressions) {
                this.setOrQueries(orExpression);
            }
        }
    }

    private setOrQueries(orExpression: Expresion): void {

        if (orExpression.operator === "==" || orExpression.operator === "!=") {

            this.queries.push(this.collectionRef.orderBy(this.DOCUMENT_POSITION).where(orExpression.field, orExpression.operator, orExpression.value));
        } else {
            this.queries.push(this.collectionRef.where(orExpression.field, orExpression.operator, orExpression.value));
        }
    }
}