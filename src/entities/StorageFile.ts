import {IgnoreField} from "../tools/decorators/FireDecorator";
import Condition from "../tools/Condition";
import AbstractEntity from "./AbstractEntity";


export default class StorageFile extends AbstractEntity{

    private fileName: string;
    private fileExtension: string;
    private fileStoragePath: string;
    private url: string;

    @IgnoreField()
    private file: Blob | Uint8Array | ArrayBuffer;

    @IgnoreField()
    private readonly noFileExtension: boolean;

    constructor(noFileExtension = false) {
        super(true);
        this.noFileExtension = noFileExtension;
    }

    public fullPath(): string {
        const fullName = `${this.fileName}.${this.fileExtension}`;
        return Condition.isNothing(this.fileStoragePath) ? fullName : `${this.fileStoragePath}/${fullName}`;
    }

    get FileName(): string {
        return this.fileName;
    }

    set FileName(value: string) {

        if (Condition.isStringEmpty(value))
            throw new Error("File Name not provided");

        this.fileName = value;
    }
    get FileExtension(): string {
        return this.fileExtension;
    }

    set FileExtension(value: string) {

        if (!this.noFileExtension && Condition.isStringEmpty(value))
            throw new Error("File Extension not provided");

        this.fileExtension = value;
    }
    get FileStoragePath(): string {
        return this.fileStoragePath;
    }

    set FileStoragePath(value: string) {
        this.fileStoragePath = value;
    }

    get Url(): string {
        return this.url;
    }

    set Url(value: string) {
        this.url = value;
    }

    get File() {
        return this.file;
    }

    set File(value: Blob | Uint8Array | ArrayBuffer) {

        if (Condition.isUndefined(value) || Condition.isNull(value))
            throw new Error("File Data not provided");

        this.file = value;
    }
}