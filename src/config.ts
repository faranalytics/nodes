type ErrorHandler =  (err: Error, ...params: Array<unknown>) => void;

interface ConfigOptions {
    errorHandler?: ErrorHandler;
}

class Config implements ConfigOptions {

    public errorHandler: (err: Error, ...params: Array<unknown>) => void;

    constructor(options?: ConfigOptions) {
        this.errorHandler = options?.errorHandler ?? console.error;
    }

    public setErrorHandler(errorHandler: ErrorHandler): void {
        this.errorHandler = errorHandler;
    }

    public getConfig(): ConfigOptions {
        return {
            errorHandler: this.errorHandler
        };
    }
}

export const config = new Config();