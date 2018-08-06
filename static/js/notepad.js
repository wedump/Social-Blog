let pc;

(_ => {

document.addEventListener('DOMContentLoaded', _ => execute(), false);

const execute = _ => {
    pc = Portland.start('main');

    const ListModel = class extends Model {
        constructor() {
            super(true);
            if(!this.list) this._load();
        }
        _load() {
            // tmp
            this._list = [new NoteModel(1, 'title01', 'contents01'), new NoteModel(2, 'title02', 'contents02'), new NoteModel(3, 'title03', 'contents03')];
            // TODO: get list from server
        }
        get(id) {
            let result, found = this._list.some(v => { if(v.id === id) return result = v; });
            if(!found) err();
            return result;
        }
        add(title, contents) {
            //tmp
            const id = 4;
            // TODO: save to server and get id

            this.list.push(new NoteModel(id, title, contents));
            this.notify(this, id);
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
            
            // TODO: save to server
            
            this.notify(this);
        }
    };

    const NotesView = class extends View {
        constructor(base) {
            super(base, true);
        }
        render(notes, id) {            
            let active;
            const ul = el('ul');
            
            for(const n of notes) {                
                const li = el('li').attr('className', 'note', 'textContent', n.title).event('click', e => this.viewModel.$viewing(n.id));                
                if(n.id === id) active = li;
                ul.append(li);
            }
            this.element.attr('innerHTML', '').append(ul);
            
            if(id)
                active.fire('click');
            else
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
    const EditorView = class extends View {
        constructor(base) {
            super(base, true);
        }
        render(id, title = '', contents = '') {
            const input = el('input').attr('name', 'title', 'type', 'text', 'placeholder', 'No Title', 'value', title);
            const textarea = el('textarea').attr('name', 'contents', 'placeholder', 'Write your content', 'value', contents);

            this.element.attr('innerHTML', '').append(el('form').append(input, textarea));
            input.fire('focus');
            
            Shortcut.add(this.element.dom, [Shortcut.CTRL, Shortcut.S], _ => app.route('editor:save', id, input.get('value'), textarea.get('value'), pc));
        }
    };

    const NotesVM = class extends ViewModel {
        constructor() {
            super(true);
        }
        base() {
            const model = new ListModel();
            model.addObserver(this.observer);
            model.notify(model);
        }
        observe(model, id) {
            if(!is(model, ListModel)) err();
            this.notify(model.list, id);
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
            model.addObserver(this.observer);
            model.notify(model);
        }
        observe(model) {
            if(!is(model, NoteModel)) err();
            this.notify(model.title, model.contents);
        }
    };
    const EditorVM = class extends ViewModel {
        constructor() {
            super(true);
        }
        base(id) {
            const model = new ListModel().get(id);
            model.addObserver(this.observer);
            model.notify(model);
        }
        new(pc) {
            pc.hide('#viewer');
            pc.hide('#notes');
            pc.show('#editor');
            
            this.notify();
        }
        save(id, title, contents, pc) {
            pc.hide('#editor');
            pc.show('#notes');
            pc.show('#viewer');
            
            if(id)
                new ListModel().get(id).edit(title, contents);
            else
                new ListModel().add(title, contents);
        }
        observe(model) {
            if(!is(model, NoteModel)) err();
            this.notify(model.title, model.contents);
        }
    };

    const app = new App();
    app.add('list', _ => new NotesVM(), _ => new NotesView('#notes'));
    app.add('viewer', _ => new ViewerVM(), _ => new ViewerView('#viewer'));
    app.add('editor', _ => new EditorVM(), _ => new EditorView('#editor'));
    app.route('list');

    Shortcut.add(window, [Shortcut.CTRL, Shortcut.ALT, Shortcut.N], _ => app.route('editor:new', pc));
};

})();