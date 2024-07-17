import EventEmitter from 'node:events';

export type ErrorHandler = (err: Error, ...params: Array<unknown>) => void;

class Config extends EventEmitter {

    public _errorHandler: ErrorHandler;
    public _debug: boolean;

    constructor() {
        super();
        this._errorHandler = console.error;
        this._debug = false;
    }

    set errorHandler(errorHandler: ErrorHandler) {
        this._errorHandler = errorHandler;
        this.emit('errorHandler', this._errorHandler);
    }

    set debug(debug: boolean) {
        this._debug = debug;
        this.emit('debug', this._debug);
    }
}

export default new Config();