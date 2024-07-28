import EventEmitter from 'node:events';

export type ErrorHandler = (err: Error, ...params: Array<unknown>) => void;

class Config extends EventEmitter {

    protected _errorHandler: ErrorHandler;
    protected _debug: boolean;

    constructor() {
        super();
        this._errorHandler = console.error;
        this._debug = false;
    }

    get errorHandler() {
        return this._errorHandler;
    }

    set errorHandler(errorHandler: ErrorHandler) {
        this._errorHandler = errorHandler;
        this.emit('errorHandler', this._errorHandler);
    }

    get debug() {
        return this._debug;
    }

    set debug(debug: boolean) {
        this._debug = debug;
        this.emit('debug', this._debug);
    }
}

export default new Config();