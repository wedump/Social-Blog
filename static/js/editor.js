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
            prop(this, { id, w, h });
        }
        get placeholder() {
            return this.id;
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
        constructor(command, w, h, _render) {
            prop(this, { command, w, h, _render });
        }
        get tooltip() {
            return this.command;
        }
        apply() {
            document.execCommand(this.command);
        }
        render(parent) {
            const element = el('button')
                .style('width', `${this.w}%`, 'height', `${this.h}%`)
                .attr('title', this.tooltip)
                .event('click', _ => this.apply());
            prop(this, { element });
            parent.append(element);
            this._render(element);
        }
    };

    const externals = {
        basic(base) {
            const boldButton = new Button('bold', 100, 10, el => el.attr('textContent', 'B'));
            const italicButton = new Button('italic', 100, 10, el => el.attr('textContent', 'I'));
            
            const menu = new Menu(10, 100);
            menu.append(boldButton);
            menu.append(italicButton);

            const title = new Paragraph('title', 100, 20);
            const contents = new Paragraph('contents', 100, 80);

            const posts = new Posts(90, 100);
            posts.append(title);
            posts.append(contents);

            const editor = new Editor(base);
            editor.menu = menu;
            editor.posts = posts;            
            editor.render();
            
            return editor;
        }
    };

    return externals;
})();