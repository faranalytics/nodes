type ErrorHandler = (err: Error, ...params: Array<unknown>) => void;

interface ConfigOptions {
    errorHandler?: ErrorHandler;
    verbose?: boolean;
}

class Config implements ConfigOptions {

    public errorHandler: ErrorHandler;
    public verbose: boolean;

    constructor(options?: ConfigOptions) {
        this.errorHandler = options?.errorHandler ?? console.error;
        this.verbose = options?.verbose ?? false;
    }

    public getConfig(): ConfigOptions {
        return {
            errorHandler: this.errorHandler,
            verbose: this.verbose
        };
    }
}

export const config = new Config();