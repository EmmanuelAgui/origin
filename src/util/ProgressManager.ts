class ProgressManager {
    _total: number;
    _loaded: number;
    _buffer: number;  
    constructor(public name: Symbol) {
        this._total = 0;
        this._loaded = 0;
        this._buffer = 0;
    }

    set total(total: number) {
        this._total = total
    }

    get total() {
        return this._total;
    }

    set loaded(loaded: number) {
        this._loaded = loaded
    }

    get loaded() {
        return this._loaded;
    }

    set buffer(buffer: number) {
        this._buffer = buffer
    }

    get buffer() {
        return this._buffer;
    }
}

export { ProgressManager }
