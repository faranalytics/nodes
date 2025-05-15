import EventEmitter from 'node:events';

export type ErrorHandler = (err: Error, ...params: Array<unknown>) => void;

interface ConfigEvents {
  errorHandler: [ErrorHandler];
  maxListeners: [number];
  debug: [boolean];
}

class Config extends EventEmitter<ConfigEvents> {

  protected _errorHandler: ErrorHandler;
  protected _maxListeners: number;
  protected _debug: boolean;

  constructor() {
    super();
    this._errorHandler = console.error;
    this._maxListeners = EventEmitter.defaultMaxListeners;
    this._debug = false;
  }

  get errorHandler(): ErrorHandler {
    return this._errorHandler;
  }

  set errorHandler(errorHandler: ErrorHandler) {
    this._errorHandler = errorHandler;
    this.emit('errorHandler', this._errorHandler);
  }

  get maxListeners(): number {
    return this._maxListeners;
  }

  set maxListeners(maxListeners: number) {
    this._maxListeners = maxListeners;
    this.emit('maxListeners', this._maxListeners);
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