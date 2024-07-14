type ErrorHandler = (err: Error, ...params: Array<unknown>) => void;

class Config {

    public errorHandler: ErrorHandler;
    public debug: boolean;

    constructor() {
        this.errorHandler = console.error;
        this.debug = false;
    }
}

export const config = new Config();