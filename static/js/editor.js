const WDEditor = (_ => {
    // Domain Layer
    const Editor = class {
        constructor(base) {
            this._init(base);
        }
        _init(base) {
            // 1. Select and save dom(Element)
            // 2. Sperator menu and paragraph area
            // 3. Apply contentEditable="true"
            // 4. Apply CSS
        }
        addMenu(menu) {
            // 1. Append list
            // 2. Append dom
        }
        addParagraph(paragraph) {
            // 1. Append list
            // 2. Append dom
        }
        removeMenu(menu) {

        }
        removeParagraph(paragraph) {

        }
    };

    const Paragraph = class {
        constructor(_placeHolder, _w, _h) {
            prop(this, { _placeHolder, _w, _h });
            this._init();
        }
        _init() {
            // 1. Create dom
            // 2. Apply placeholder and size and CSS
        }
    };

    const Menu = class {
        constructor() {
            this._init();
        }
        _init() {
            // 1. Create DOM
            // 2. Apply CSS
        }
        add(button) {
            // 1. Append list
            // 2. Append dom
        }
    };

    const Button = class {
        constructor(_toolTip, _image) {
            prop(this, { _toolTip, _image});
            this._init();
        }
        _init() {
            // 1. Create button dom
            // 2. Apply toolTip and image
        }
        apply(){ override(); }
    };
    const FaceButton = class extends Button {
        constructor(toolTip, image) {
            super(toolTip, image);
        }
        apply() {

        }
    };
    const SizeButton = class extends Button {
        constructor(toolTip, image) {
            super(toolTip, image);
        }
        apply() {

        }
    };

    // Native Layer
    const Renderer = class {
        render() {

        }
    };

    // Host Code
    return {
        transform(base) {
            // TODO: 컴포넌트의 사이즈 지정 및 관리 방법 정하고 반영하기(버튼 사이즈는 누가 정하나, 에디터 내부에 메뉴영역과 단락영역 나눠 처리하기)

            const faceImage = null;
            const sizeImage = null;
            const faceButton = new FaceButton('Face', faceImage);
            const sizeButton = new SizeButton('Size', sizeImage);
            
            const menu = new Menu();
            menu.add(faceButton);
            menu.add(sizeButton);

            const title = new Paragraph('Title', '100%', '20%');
            const contents = new Paragraph('Contents', '100%', '80%');

            const editor = new Editor(base);
            editor.addMenu(menu);
            editor.addParagraph(title);
            editor.addParagraph(contents);

            return editor;
        }
    };
})();

const editor = WDEditor.transform('#editor');