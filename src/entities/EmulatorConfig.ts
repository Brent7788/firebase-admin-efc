
export default class EmulatorConfig {
    public localhost = "localhost";
    public firestorePort: number | undefined;
    public authPort: number | undefined;

    constructor(firestorePort: number | undefined = undefined, authPort: number | undefined = undefined) {
        this.firestorePort = firestorePort;
        this.authPort = authPort;
    }
}