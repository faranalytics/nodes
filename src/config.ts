type ErrorHandler = (err: Error, ...params: Array<unknown>) => void;

class Config {

    public errorHandler: ErrorHandler;
    public verbose: boolean;

    constructor() {
        this.errorHandler = console.error;
        this.verbose = false;
    }
}

export const config = new Config();