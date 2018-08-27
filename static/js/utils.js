const round2 = n => parseFloat(n.toFixed(2));

const prop = (t, o) => Object.assign(t, o);

const err = msg => { throw (msg || 'invalid'); };

const override = _ => err('override');

const do_nothing = _ => {};

const is = (i, c) => {
    if(typeof c === 'object')
        return Object.entries(c).some(([k, v]) => v === i);
    else {
        if(i)
            return i instanceof c;
        else
            return false;
    }
};

const aop = (target, { beforeExcept, beforeFn, afterExcept, afterFn }) => {
    return new Proxy(target, {
        get(obj, prop, receiver) {
            let value = Reflect.get(obj, prop, receiver);
            
            if(typeof value === 'function') {
                value = (...arg) => {
                    if(beforeExcept && beforeFn && !beforeExcept.test(prop)) beforeFn(obj);
                    const result = Reflect.apply(obj[prop], obj, arg);
                    if(afterExcept && afterFn && !afterExcept.test(prop)) afterFn(obj);
                    return result;
                };
            }
            
            return value;
        }
    });
};

const Element = class {
    constructor(_dom = err()) {        
        prop(this, { _dom, _children: [] });
    }
    get dom() { return this._dom; }
    get(attrName) {
        return this.dom[attrName];
    }
    attr(...arg) {
        for(let i = 0; i < arg.length; i += 2) {
            if(arg[i] in this.dom)
                this.dom[arg[i]] = arg[i+1];
            else
                this.dom.setAttribute(arg[i], arg[i+1]);
        }
        return this;
    }
    append(...arg) {
        for(const e of arg) {
            this._children.push(e);
            this.dom.appendChild(e.dom);            
        }
        return this;
    }
    remove(...arg) {
        for(const e of arg) {
            this._children.splice(this._children.indexOf(e), 1);
            this.dom.removeChild(e.dom);
        }
        return this;
    }
    event(eventTypes, listener) {
        if(is(eventTypes, Array))
            eventTypes.forEach(type => this.dom.addEventListener(type, listener));
        else
            this.dom.addEventListener(eventTypes, listener)
        return this;
    }
    unevent(eventTypes, listener) {
        if(is(eventTypes, Array))
            eventTypes.forEach(type => this.dom.removeEventListener(type, listener));
        else
            this.dom.removeEventListener(eventTypes, listener)
        return this;
    }
    trigger(eventType) {
        this.dom.dispatchEvent(new Event(eventType));
        return this;
    }
    first() {
        return this._children[0];
    }
    last() {
        return this._children[this._children.length-1];
    }
    fire(eventType) {
        this.dom[eventType]();
        return this;
    }
    style(...arg) {
        for(let i = 0; i < arg.length; i += 2)
            this.dom.style[arg[i]] = arg[i+1];
        return this;
    }
    show() {
        this.dom.style.display = '';
    }
    hide() {
        this.dom.style.display = 'none';
    }
    toggle() {
        if(this.dom.style.display === 'none')
            this.show();
        else
            this.hide();
    }
    value(v) {
        const d = this.dom;
        if(v === undefined)
            return this.dom.value || this.dom.textContent;            
        else {
            if('value' in d) d.value = v;
            if('textContent' in d) d.textContent = v;
            return this;
        }
    }
    sel(target) {
        return new Element(this.dom.querySelector(target));
    }
    addStyleRule(...arg) {
        if(this.dom.tagName !== 'STYLE') return this;
        const sheet = this.dom.sheet;
        const rules = sheet.cssRules;
        for(const rule of arg) sheet.insertRule(rule, rules.length);
        return this;
    }
};
const sel = target => {
    switch(true) {
        case typeof target === 'string':
            const dom = document.querySelector(target);
            return new Element(dom);
        case typeof target === 'object':
            return new Element(target);
        default: break;
    }   
};
const el = tagName => {
    const dom = document.createElement(tagName);
    return new Element(dom);
};