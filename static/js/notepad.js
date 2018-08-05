let pc;

(_ => {

document.addEventListener('DOMContentLoaded', _ => execute(), false);

const execute = _ => {
    pc = Portland.start('main');

    const ListModel = class extends Model {
        constructor() {
            super(true);
            this._load();
        }
        _load() {
            // tmp
            this._list = [new NoteModel(1, 'title01', 'contents01'), new NoteModel(2, 'title02', 'contents02'), new NoteModel(3, 'title03', 'contents03')];
        }
        get(id) {
            let result, found = this._list.some(v => { if(v.id === id) return result = v; });
            if(!found) err();
            return result;
        }
        get list() { return this._list; }
    };
    const NoteModel = class extends Model {
        constructor(_id = err(), _title = err(), _contents) {
            super(false);
            prop(this, { _id, _title, _contents });
        }
        get id() { return this._id; }
        get title() { return this._title; }
        get contents() { return this._contents; }
        edit(_title, _contents) {
            prop(this, { _title, _contents });
            this.notify();
        }
    };

    const NotesView = class extends View {
        constructor(base) {
            super(base, true);
        }
        render(notes) {
            const ul = el('ul');
            for(const n of notes) {
                ul.append(el('li')
                    .attr('className', 'note', 'textContent', n.title)
                    .event('click', e => this.viewModel.$viewing(n.id))
                );
            }
            this.element.attr('innerHTML', '').append(ul);
            ul.first().fire('click');
        }
    };
    const ViewerView = class extends View {
        constructor(base) {
            super(base, true);
        }
        render(title, contents) {
            this.element.attr('innerHTML', '').append(
                el('section').append(
                    el('h1').attr('className', 'title', 'textContent', title),
                    el('p').attr('className', 'contents', 'textContent', contents)
                )
            );
        }
    };

    const NotesVM = class extends ViewModel {
        constructor() {
            super(true);
        }
        base() {
            const model = new ListModel();
            model.add(this.observer);
            model.notify();
        }
        observe(model) {
            if(!is(model, ListModel)) err();
            this.notify(model.list);
        }
        $viewing(id) {
            app.route('viewer', id);
        }
    };
    const ViewerVM = class extends ViewModel {
        constructor() {
            super(true);
        }
        base(id) {
            const model = new ListModel().get(id);
            model.add(this.observer);
            model.notify();
        }
        observe(model) {
            if(!is(model, NoteModel)) err();
            this.notify(model.title, model.contents);
        }        
    };

    const app = new App();
    app.add('list', _ => new NotesVM(), _ => new NotesView('#notes'));
    app.add('viewer', _ => new ViewerVM(), _ => new ViewerView('#viewer'));
    app.route('list');
};

})();