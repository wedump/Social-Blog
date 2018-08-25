const WDEditor = (_ => {
    const Editor = class {
        constructor(_base) {
            prop(this, { _base });
        }
        get posts() {
            return this._posts;
        }
        set posts(_posts) {
            prop(this, { _posts });
        }
        get menu() {
            return this._menu;
        }
        set menu(_menu) {
            prop(this, { _menu });
        }
        get(id) {
            const paragraph = this._posts.get(id);
            return paragraph && paragraph.element;
        }
        render() {
            const element = sel(this._base).attr('innerHTML', '');
            prop(this, { element });
            this._posts.render(element);
            this._menu.render(element);
        }
    };

    const Posts = class {
        constructor(w, h) {
            prop(this, { w, h, paragraphs: [] });
        }
        append(paragraph) {
            this.paragraphs.push(paragraph);
        }
        get(id) {
            let target;
            this.paragraphs.some(p => p.id === id ? target = p : false);
            return target;
        }
        render(parent) {
            const element = el('section').style('display', 'inline-block', 'width', `${this.w}%`, 'height', `${this.h}%`, 'float', 'left');            
            prop(this, { element });
            parent.append(element);
            for(const paragraph of this.paragraphs) paragraph.render(element);
        }
    };

    const Paragraph = class {
        constructor(id, w, h) {
            prop(this, { id, w, h, _placeholder: id });
        }
        get placeholder() {
            return this._placeholder;
        }
        set placeholder(_placeholder) {
            prop(this, { _placeholder });
        }
        render(parent) {
            const element = el('div')
                .style('display', 'inline-block', 'width', `${this.w}%`, 'height', `${this.h}%`, 'border', '1px dashed #ccc')
                .attr('contentEditable', 'true', 'placeholder', this.placeholder);
            prop(this, { element });
            parent.append(element);
        }
    };

    const Menu = class {
        constructor(w, h) {
            prop(this, { w, h, buttons: [] });
        }
        append(button) {
            this.buttons.push(button);
        }
        render(parent) {
            const element = el('section').style('display', 'inline-block', 'width', `${this.w}%`, 'height', `${this.h}%`);
            prop(this, { element });
            parent.append(element);
            for(const button of this.buttons) button.render(element);
        }
    };

    const Button = class {
        constructor(command, w, h) {
            return prop(Singleton.getInstance(this), { command, w, h, _tooltip: command });
        }
        get tooltip() {
            return this._tooltip;
        }
        set tooltip(_tooltip) {
            prop(this, { _tooltip });
        }
        apply(arg) {
            document.execCommand(this.command, false, arg);
        }
        render(parent) {
            const element = el('div')
                .style('display', 'inline-block', 'width', `${this.w}%`, 'height', `${this.h}%`)
                .attr('title', this.tooltip);
            prop(this, { element });
            parent.append(element);
            this._render();
        }
        _render() { override(); }
    };
    const BoldButton = class extends Button {
        constructor(w, h) {
            super('bold', w, h);
        }
        _render() {
            this.element.append(
                el('button').value('B').style('width', '100%', 'height', '100%').event('click', _ => this.apply())
            );
        }
    };
    const ItalicButton = class extends Button {
        constructor(w, h) {
            super('italic', w, h);
        }
        _render() {
            this.element.append(
                el('button').value('I').style('width', '100%', 'height', '100%').event('click', _ => this.apply())
            );
        }
    };
    const UnderlineButton = class extends Button {
        constructor(w, h) {
            super('underline', w, h);
        }
        _render() {
            this.element.append(
                el('button').value('U').style('width', '100%', 'height', '100%', 'text-decoration', 'underline').event('click', _ => this.apply())
            );
        }
    };
    const StrikeThroughButton = class extends Button {
        constructor(w, h) {
            super('strikeThrough', w, h);
        }
        _render() {
            this.element.append(
                el('button').value('S').style('width', '100%', 'height', '100%', 'text-decoration', 'line-through').event('click', _ => this.apply())
            );
        }
    };
    const HeaderButton = class extends Button {
        constructor(w, h) {
            super('formatBlock', w, h);
        }
        _render() {
            const values = { p: '본문', h1: '헤더1', h2: '헤더2', h3: '헤더3' };
            const select = el('select')
                .style('width', '100%', 'height', '100%')
                .event('change', e => this.apply('<' + e.target.options[e.target.selectedIndex].value + '>'));
            
            Object.entries(values).forEach(([k, v]) => select.append(el('option').value(k).attr('textContent', v)));
            this.element.append(select);
        }
    };

    const externals = {
        basic(base) {
            // TODO:
            //   - items : face, size, color, block-color, align, link, box
            //   - needs
            //     1) simple button -> detail component(select-box, input-box) for face, size, color, block-color, link
            //     2) insert html component(with css and applied command) for box
            //     3) insert html component(with css) for button detail display
            
            const headerButton = new HeaderButton(100, 10);

            const menu = new Menu(10, 100);
            menu.append(headerButton);
            menu.append(new BoldButton(100, 10));
            menu.append(new ItalicButton(100, 10));
            menu.append(new UnderlineButton(100, 10));
            menu.append(new StrikeThroughButton(100, 10));            

            const title = new Paragraph('title', 100, 10);
            const contents = new Paragraph('contents', 100, 90);

            const posts = new Posts(90, 100);
            posts.append(title);
            posts.append(contents);

            const editor = new Editor(base);
            editor.menu = menu;
            editor.posts = posts;
            editor.render();

            contents.element.event('focus', _ => headerButton.element.sel('select').trigger('change'));
            
            return editor;
        },
        Editor, Posts, Paragraph, Menu, Button
    };

    return externals;
})();