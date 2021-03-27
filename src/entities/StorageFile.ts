import {IgnoreField} from "../tools/decorators/FireDecorator";
import Condition from "../tools/Condition";
import AbstractEntity from "./AbstractEntity";


export default class StorageFile extends AbstractEntity {

    private _name: string;
    private _extension: string;
    private _storagePath: string;
    private _url: string;

    @IgnoreField()
    private _rowData: Blob | Uint8Array | ArrayBuffer | string;

    @IgnoreField()
    private readonly noFileExtension: boolean;

    constructor(noFileExtension = false) {
        super(true);
        this.noFileExtension = noFileExtension;
    }

    protected validate() {
        if (Condition.isStringEmpty(this._name))
            throw new Error("File Name not provided");

        if (!this.noFileExtension && Condition.isStringEmpty(this._extension))
            throw new Error("File Extension not provided");

        const urlNotExit = Condition.isNothing(this._url);

        if (urlNotExit && Condition.isUndefined(this._rowData) || Condition.isNull(this._rowData))
            throw new Error("File Data not provided");
    }

    public fullPath(): string {
        const fullName = `${this._name}.${this._extension}`;
        return Condition.isNothing(this._storagePath) ? fullName : `${this._storagePath}/${fullName}`;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }
    get extension(): string {
        return this._extension;
    }

    set extension(value: string) {
        this._extension = value;
    }
    get storagePath(): string {
        return this._storagePath;
    }

    set storagePath(value: string) {
        this._storagePath = value;
    }
    get url(): string {
        return this._url;
    }

    set url(value: string) {
        this._url = value;
    }
    get rowData(): Blob | Uint8Array | ArrayBuffer | string {
        return this._rowData;
    }

    set rowData(value: Blob | Uint8Array | ArrayBuffer | string) {
        this._rowData = value;
    }
}