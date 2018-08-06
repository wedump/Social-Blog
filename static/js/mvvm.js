const Singleton = (_ => {
    const instances = new WeakMap();
    return {
        getInstance(v) {
            if(!instances.has(v.constructor)) instances.set(v.constructor, v);
            return instances.get(v.constructor);
        }
    };
})();

const Subject = class extends Set {
    add() { err(); }
    delete() { err(); }    
    addObserver(o) {
        if(!is(o, Observer)) err();
        super.add(o);
    }    
    deleteObserver(o) {
        if(!is(o, Observer)) err();
        super.delete(o);
    }
    has(o) {
        if(!is(o, Observer)) err();
        return super.has(o);
    }
    notify(...arg) {
        super.forEach(o => o.observe(...arg));
    }
};

const Observer = class {
    observe(v) { override(); }
};

const App = class {
    constructor(_base) {
        prop(this, { _base, _table: new Map() });
    }
    add(k = err(), viewModel = err(), view = err()) {
        this._table.set(k, [viewModel, view]);
    }
    route(path = err(), ...arg) {
        const [k, action = 'base'] = path.split(':');
        if(!this._table.get(k)) return;
        const [viewModel, view] = this._table.get(k).map(f => f());
        view.viewModel = viewModel;
        viewModel[action](...arg);
        if(this._base) sel(this._base).attr('innerHTML', '').append(view.element);
    }
};

const Model = class extends Subject {
    constructor(isSingleton) {
        super();
        if(isSingleton) return Singleton.getInstance(this);
    }
};

const View = class extends Observer {
    constructor(base, isSingleton) {
        super();
        return prop(isSingleton ? Singleton.getInstance(this) : this, { _element: sel(base) });
    }
    get element() { return this._element; }
    get viewModel() { return this._viewModel; }
    set viewModel(_viewModel) {
        prop(this, { _viewModel });
        _viewModel.addObserver(this);
    }
    observe(...arg) { this.render(...arg); }
    render() { override(); }
};

const ViewModelObserver = class extends Observer {
    constructor(_viewModel) {
        super();
        prop(this, { _viewModel });
    }
    observe(...arg) { this._viewModel.observe(...arg); }
};

const ViewModel = class extends Subject {
    constructor(isSingleton) {
        super();
        const target = isSingleton ? Singleton.getInstance(this) : this;
        prop(target, { _observer: new ViewModelObserver(target) });
        return target;
    }
    get observer() { return this._observer; }
    base() { override(); }
    observe() { override(); }
};