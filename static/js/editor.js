const WDEditor = (_ => {
    const Editor = class {
        constructor(_base) {
            prop(this, { _base, _style: el('style') });
            sel(document.head).append(this._style);
            this._style.addStyleRule(`${this._base} [contenteditable=true]:empty:before { content: attr(placeholder); color: #ccc; }`);
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
            this._posts.render(element, this._base, this._style);
            this._menu.render(element, this._base, this._style);
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
        render(parent, base, style) {
            const element = el('section').attr('name', 'posts').style('display', 'inline-block', 'width', `${this.w}%`, 'height', `${this.h}%`, 'float', 'left');
            prop(this, { element, base: `${base} [name='posts']` });
            parent.append(element);
            for(const paragraph of this.paragraphs) paragraph.render(element, this.base, style);
        }
    };

    const Paragraph = class {
        constructor(id, w, h, _init) {
            prop(this, { id, w, h, _placeholder: id, _init });
        }
        get placeholder() {
            return this._placeholder;
        }
        set placeholder(_placeholder) {
            prop(this, { _placeholder });
        }
        init() {
            const listener = e => {
                if(!sel(e.target).value()) {
                    this._init(e);
                    sel(e.target).fire('focus');
                    const backspace = 8;
                    if(e.keyCode === backspace) e.returnValue = false;
                }
            };
            this.element.event(['focus', 'keydown', 'keyup'], listener);
        }
        render(parent, base, style) {
            const element = el('div')
                .style('display', 'inline-block', 'width', `${this.w}%`, 'height', `${this.h}%`, 'border', '1px dashed #ccc')
                .attr('name', this.id, 'contentEditable', 'true', 'placeholder', this.placeholder);
            prop(this, { element, base: `${base} [name='${this.id}']` });
            parent.append(element);
            this._render(style);
            this.init();
        }
        _render() { override(); }
    };
    const SingleLineParagraph = class extends Paragraph {
        constructor(id, w, h, _init) {
            super(id, w, h, _init);
        }
        _render(style) {
            this.element.style('white-space', 'nowrap', 'overflow', 'hidden');
            style.addStyleRule(`${this.base} br { display: none; }`, `${this.base} * { display: inline; white-space: nowrap; }`);
        }
    };
    const MultiLineParagraph = class extends Paragraph {
        constructor(id, w, h, _init) {
            super(id, w, h, _init);
        }
        _render() { do_nothing(); }
    };

    const Menu = class {
        constructor(w, h) {
            prop(this, { w, h, buttons: [] });
        }
        append(button) {
            this.buttons.push(button);
        }
        render(parent, base, style) {
            const element = el('section').attr('name', 'menu').style('display', 'inline-block', 'width', `${this.w}%`, 'height', `${this.h}%`);
            prop(this, { element, base: `${base} [name='menu']` });
            parent.append(element);
            for(const button of this.buttons) button.render(element, base, style);
        }
    };

    const Button = class {
        constructor(id, command, w, h, isSingleton = true) {
            return prop(isSingleton ? Singleton.getInstance(this) : this, { id, command, w, h, _tooltip: id });
        }
        get tooltip() {
            return this._tooltip;
        }
        set tooltip(_tooltip) {
            prop(this, { _tooltip });
        }
        apply(arg) {
            let cmd = this.command;
            if(is(this.command, Array)) {
                cmd = this.command.pop();
                this.command.unshift(cmd);
            }
            document.execCommand(cmd, false, arg);
        }
        render(parent, base, style) {
            const element = el('div')
                .style('display', 'inline-block', 'width', `${this.w}%`, 'height', `${this.h}%`)
                .attr('name', this.id, 'title', this.tooltip);
            prop(this, { element, base: `${base} [name='${this.id}']` });
            parent.append(element);
            this._render(style);
        }
        _render() { override(); }
        click() { override(); }
    };
    const FaceButton = class extends Button {
        constructor(w, h) {
            super('FontFace', 'fontName', w, h);
        }
        _render() {
            const faces = ['Consolas', 'Verdana', 'Georgia'];
            const select = el('select')
                .style('width', '100%', 'height', '100%')
                .event('change', e => this.apply(select.value()));
            
            for(const face of faces) select.append(el('option').value(face));
            this.element.append(select);
        }
        click() {
            this.element.sel('select').trigger('change');
        }
    };
    const HeaderButton = class extends Button {
        constructor(w, h) {
            super('Header', 'formatBlock', w, h);
        }
        _render() {
            const values = { p: '본문', h1: '헤더1', h2: '헤더2', h3: '헤더3' };
            const select = el('select')
                .style('width', '100%', 'height', '100%')
                .event('change', e => this.apply('<' + select.value() + '>'));
            
            Object.entries(values).forEach(([k, v]) => select.append(el('option').value(k).attr('textContent', v)));
            this.element.append(select);
        }
        click() {
            this.element.sel('select').trigger('change');
        }
    };
    const ColorButton = class extends Button {
        constructor(w, h) {
            super('Color', 'foreColor', w, h);
        }
        _render() {
            const colors = ['#333333', '#ffffff', '#959595', '#f4c216', '#16b06d', '#f6665b', '#00c3bd', '#ec4c6a'];
            const select = el('select')
                .style('width', '100%', 'height', '100%')
                .event('change', e => {
                    const color = select.value();
                    select.style('color', color);
                    this.apply(color);
                });
            
            for(const color of colors) {
                select.append(
                    el('option').value(color).attr('textContent', '■').style('color', color)
                );
            }
            this.element.append(select);
        }
        click() {
            this.element.sel('select').trigger('change');
        }
    };
    const HiliteButton = class extends Button {
        constructor(w, h) {
            super('Hilite', 'hiliteColor', w, h);
        }
        _render() {
            const colors = ['#ffffff', '#333333', '#959595', '#f4c216', '#16b06d', '#f6665b', '#00c3bd', '#ec4c6a'];
            const select = el('select')
                .style('width', '100%', 'height', '100%')
                .event('change', e => {
                    const color = select.value();
                    select.style('color', color);
                    this.apply(color);
                });
            
            for(const color of colors) {
                select.append(
                    el('option').value(color).attr('textContent', '■').style('color', color)
                );
            }
            this.element.append(select);
            this.click();
        }
        click() {
            this.element.sel('select').trigger('change');
        }
    };    
    const BoldButton = class extends Button {
        constructor(w, h) {
            super('Bold', 'bold', w, h);
        }
        _render() {
            this.element.append(
                el('button').value('B').style('width', '100%', 'height', '100%').event('click', _ => this.apply())
            );
        }
        click() {
            this.element.trigger('click');
        }
    };
    const ItalicButton = class extends Button {
        constructor(w, h) {
            super('Italic', 'italic', w, h);
        }
        _render() {
            this.element.append(
                el('button').value('I').style('width', '100%', 'height', '100%').event('click', _ => this.apply())
            );
        }
        click() {
            this.element.trigger('click');
        }
    };
    const UnderlineButton = class extends Button {
        constructor(w, h) {
            super('Underline', 'underline', w, h);
        }
        _render() {
            this.element.append(
                el('button').value('U').style('width', '100%', 'height', '100%', 'text-decoration', 'underline').event('click', _ => this.apply())
            );
        }
        click() {
            this.element.trigger('click');
        }
    };
    const StrikeThroughButton = class extends Button {
        constructor(w, h) {
            super('StrikeThrough', 'strikeThrough', w, h);
        }
        _render() {
            this.element.append(
                el('button').value('S').style('width', '100%', 'height', '100%', 'text-decoration', 'line-through').event('click', _ => this.apply())
            );
        }
        click() {
            this.element.trigger('click');
        }
    };
    const AlignButton = class extends Button {
        constructor(w, h) {
            super('Align', ['justifyLeft', 'justifyCenter'], w, h);
        }
        _render() {
            this.element.append(
                el('button').value('≡').style('width', '100%', 'height', '100%').event('click', _ => this.apply())
            );
        }
        click() {
            this.element.trigger('click');
        }
    };
    const LinkButton = class extends Button {
        constructor(w, h) {
            super('Link', 'createLink', w, h);
        }
        _render() {
            let savedRanges = [];
            const link = el('input').style('display', 'inline', 'width', '200px');
            
            const box = el('div').style('position', 'absolute', 'left', '-300px', 'width', '300px').hide().append(
                link,
                el('button').style('width', '45px').value('취소').event('click', _ => { loadRanges(savedRanges), box.hide(); }),
                el('button').style('width', '45px').value('확인').event('click', _ => { loadRanges(savedRanges), box.hide(), this.apply(link.value()); })
            );
            
            this.element.style('position', 'relative').append(
                box,
                el('button').value('∞').style('width', '100%', 'height', '100%').event('click', _ => { savedRanges = saveRanges(), box.show(), link.fire('focus'); })
            );
        }
        click() {
            this.element.trigger('click');
        }
    };
    const BoxButton = class extends Button {
        constructor(w, h) {
            super('Box', 'formatBlock', w, h);
        }
        _render() {
            this.element.append(
                el('button').value('□').style('width', '100%', 'height', '100%')
                    .event('click', _ => {
                        const savedRanges = saveRanges();
                        new EnterButton().click();
                        loadRanges(savedRanges);
                        this.apply(`<blockquote>`);
                        focusElement().parent().style('display', 'block', 'border', '1px solid #ccc', 'padding', '15px');
                    })
            );
        }
        _click() {
            this.element.trigger('click');
        }
    }
    const EnterButton = class extends Button {
        constructor() {
            super('Enter', 'insertParagraph');
        }
        _render() { do_nothing(); }
        click() { this.apply(); }
    }

    const externals = {
        basic(base) {            
            const faceButton = new FaceButton(100, 8);
            const headerButton = new HeaderButton(100, 8);
            const colorButton = new ColorButton(100, 8);

            const menu = new Menu(10, 100);
            menu.append(faceButton);
            menu.append(headerButton);
            menu.append(colorButton);
            menu.append(new HiliteButton(100, 8));
            menu.append(new BoldButton(100, 8));
            menu.append(new ItalicButton(100, 8));
            menu.append(new UnderlineButton(100, 8));
            menu.append(new StrikeThroughButton(100, 8));
            menu.append(new AlignButton(100, 8));
            menu.append(new LinkButton(100, 8));
            menu.append(new BoxButton(100, 8));

            const title = new SingleLineParagraph('title', 100, 10, e => { sel(e.target).attr('innerHTML', ''), faceButton.click(), colorButton.click(); });
            title.placeholder = '제목을 입력하세요';
            const contents = new MultiLineParagraph('contents', 100, 90, _ => { faceButton.click(), headerButton.click(), colorButton.click(); });

            const posts = new Posts(90, 100);
            posts.append(title);
            posts.append(contents);

            const editor = new Editor(base);
            editor.menu = menu;
            editor.posts = posts;
            editor.render();
            
            return editor;
        },
        Editor, Posts, Paragraph, Menu, Button
    };

    return externals;
})();