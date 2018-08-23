const WDEditor = (_ => {
    // Domain Layer
    const Editor = class {
        get menu() {
            return this._menu;
        }
        set menu(_menu) {
            prop(this, { _menu });
        }
        get posts() {
            return this._posts;
        }
        set posts(_posts) {
            prop(this, { _posts });
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
    };

    const Paragraph = class {
        constructor(id, w, h) {
            prop(this, { id, w, h });
        }
        get placeholder() {
            return this.id;
        }
    };

    const Menu = class {
        constructor(w, h) {
            prop(this, { w, h, buttons: [] });
        }
        append(button) {
            this.buttons.push(button);
        }
    };

    const Button = class {
        constructor(command, w, h, renderer) {
            prop(this, { command, w, h, renderer });
        }
        get tooltip() {
            return this.command;
        }
        render(element) {
            this.renderer.render(element);
        }
        apply(commander) {
            commander.execute(this.command);
        }
    };
    const BoldButton = class extends Button {
        constructor(w, h, renderer) {
            super('bold', w, h, renderer);
        }
    };
    const ItalicButton = class extends Button {
        constructor(w, h, renderer) {
            super('italic', w, h, renderer);
        }
    };

    // Native Layer
    const commander = {
        execute(command) { document.execCommand(command) }
    };
    
    const render = (base, editor) => {
        if(!editor || !editor.menu || !editor.menu.buttons || !editor.posts || !editor.posts.paragraphs) err();
        
        const posts = el('section').style('display', 'inline-block', 'width', `${editor.posts.w}%`, 'height', `${editor.posts.h}%`, 'float', 'left');
        const menu  = el('section').style('display', 'inline-block', 'width', `${editor.menu.w}%`, 'height', `${editor.menu.h}%`);        
        sel(base).attr('innerHTML', '').append(posts, menu);

        for(const paragraph of editor.posts.paragraphs) {
            posts.append(
                el('div')
                    .style('display', 'inline-block', 'width', `${paragraph.w}%`, 'height', `${paragraph.h}%`, 'border', '1px dashed #ccc')
                    .attr('contentEditable', 'true', 'placeholder', paragraph.placeholder)
            );
        }
        for(const button of editor.menu.buttons) {
            const element = el('button')
                .style('width', `${button.w}%`, 'height', `${button.h}%`)
                .attr('title', button.tooltip)
                .event('click', _ => button.apply(commander));
            menu.append(element);
            button.render(element);
        }
    };

    const boldRenderer = {
        render(element) {
            element.attr('textContent', 'B').style('border', '1px solid #ccc');
        }
    };
    const italicRenderer = {
        render(element) {
            element.attr('textContent', 'I').style('border', '1px solid #ccc');
        }
    };

    // Host Code
    return {
        transform(base) {            
            const boldButton = new BoldButton(100, 10, boldRenderer);
            const italicButton = new ItalicButton(100, 10, italicRenderer);
            
            const menu = new Menu(10, 100);
            menu.append(boldButton);
            menu.append(italicButton);

            const title = new Paragraph('title', 100, 20);
            const contents = new Paragraph('contents', 100, 80);

            const posts = new Posts(90, 100);
            posts.append(title);
            posts.append(contents);

            const editor = new Editor();
            editor.menu = menu;
            editor.posts = posts;
            
            render(base, editor);

            return editor;
        }
    };
})();