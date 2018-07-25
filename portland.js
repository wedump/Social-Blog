const Portland = (() => {

const round2 = n => parseFloat(n.toFixed(2));
const prop = (t, o) => Object.assign(t, o);
const err = msg => { throw (msg || 'Invalid'); };
const override = _ => err('override');
const is = (i, c) => {
    if(typeof c === 'object')
        return Object.entries(c).some(([k, v]) => { if(v === i) return true; });
    else {
        if(i)
            return i instanceof c;
        else
            return false;
    }
};

const Direction = { LEFT: Symbol(), UP: Symbol(), RIGHT: Symbol(), DOWN: Symbol() };

const PortletController = class {
    constructor(inputInterpreter, portland) {
        if(!is(inputInterpreter, InputInterpreter)) err();
        if(!is(portland, Portland)) err();
        
        prop(this, { inputInterpreter, portland });
    }
    initialize() {
        this.portland.initialize(this.inputInterpreter.eventType, e => { e.stopPropagation(); this._control(e); });
    }
    _control(event) {
        const { command, target, input } = this.inputInterpreter.interpret(event, this.portland.portlets);
        
        if(!command) return;

        switch(command) {
            case InputInterpreter.command.CHANGE_LOCATION:
                if(!is(target, Portlet) || !is(input, Direction)) return;
                this.portland.changeLocation(target, input);
                break;
            case InputInterpreter.command.CHANGE_SIZE:
                if(!is(target, Portlet) || !is(input, Direction)) return;
                this.portland.changeSize(target, input);
                break;
            case InputInterpreter.command.FOCUS_AND_HIDE:
                const number = input;
                if(isNaN(number)) this.portland.showPortletNumbers();
                else {
                    if(!this.portland.contains(number)) return;
                    
                    if(this.portland.isFocus(number)) this.portland.hide(number);
                    else {
                        if(this.portland.isHide(number))
                            this.portland.show(number);
                        else
                            this.portland.focus(number);
                    }
                }
                break;
            default: err();
        }
    }
};

const InputInterpreter = class {
    interpret(event, portlets) { override(); }
    get eventType() { override(); }
}
InputInterpreter.command = { CHANGE_LOCATION: Symbol(), CHANGE_SIZE: Symbol(), FOCUS_AND_HIDE: Symbol() };
const KeyboardInputInterpreter = class extends InputInterpreter {
    interpret(event, portlets) {
        let command, target, input;
        
        portlets.some(p => { if(p.dom === event.target) return target = p; });

        switch(true) {
            case event.ctrlKey:
                command = InputInterpreter.command.CHANGE_LOCATION;
                input = KeyboardInputInterpreter.direction[event.keyCode];
                break;
            case event.shiftKey:
                command = InputInterpreter.command.CHANGE_SIZE;
                input = KeyboardInputInterpreter.direction[event.keyCode];
                break;
            case event.altKey:
                command = InputInterpreter.command.FOCUS_AND_HIDE;
                input = KeyboardInputInterpreter.number[event.keyCode];                
                break;
            default: break;
        }
        
        return { command, target, input };
    }
    get eventType() {
        return 'keydown';
    }
};
KeyboardInputInterpreter.direction = { 37: Direction.LEFT, 38: Direction.UP, 39: Direction.RIGHT, 40: Direction.DOWN };
KeyboardInputInterpreter.number = { 48: 0, 49: 1, 50: 2, 51: 3, 52: 4, 53: 5, 54: 6, 55: 7, 56: 8, 57: 9 };

const Portland = class {
    constructor(geometryCalculator, animationSelector, renderer) {
        if(!is(geometryCalculator, GeometryCalculator)) err();        
        if(!is(animationSelector, AnimationSelector)) err();
        if(!is(renderer, Renderer)) err();

        prop(this, { geometryCalculator, animationSelector, renderer });
    }
    initialize(eventType, listener) {
        this.portlets = [];
        this.root = new Portlet(0, 0, Portlet.divideN, Portlet.divideN, document.querySelector('body'));
        this._initialize(eventType, listener, this.root);
        this.prevListener = listener;
    }
    _initialize(eventType, listener, parent) {
        if(parent == this.root) {
            if(this.prevListener) window.removeEventListener(eventType, this.prevListener);
            window.addEventListener(eventType, listener);
        }
        const domes = parent.dom.querySelectorAll(':scope > [data-portlet]');
        for(const d of domes) {
            if(this.prevListener) d.removeEventListener(eventType, this.prevListener);
            d.addEventListener(eventType, listener);
            d.tabIndex = '0';
            
            const [x, y, w, h] = d.dataset.portlet.split(' ').map(e => parseFloat(e));
            const p = new Portlet(x, y, w, h, d);
            parent.append(p);
            this.portlets.push(p);
            this.renderer.render(p);

            this._initialize(eventType, listener, p);
        }
    }
    changeLocation(target, direction) {
        this._change(target, direction, 'calculateLocation');
    }
    changeSize(target, direction) {
        this._change(target, direction, 'calculateSize');
    }
    _change(target, direction, method) {
        const targets = this.geometryCalculator[method](target, direction, target.parent.children);
        
        for(const t of targets) {
            t.portlet.location(t.x, t.y);
            t.portlet.size(t.w, t.h);
            const animation = t.dom === target ? this.animationSelector.get(AnimationSelector.type.TARGET) : this.animationSelector.get(AnimationSelector.type.OTHER);
            this.renderer.render(t.portlet, animation);
        }
    }
    contains(number) {
        return !!this.portlets[number];
    }
    isFocus(number) {
        const p = this.portlets[number];
        if(p && p.dom === document.activeElement) return true;
        return false;
    }
    isHide(number) {
        const p = this.portlets[number];
        if(p && p.hideW)
            return true;
        else
            return false;
    }
    focus(number) {
        const p = this.portlets[number];
        if(p) p.dom.focus();
    }   
    show(number) {
        const p = this.portlets[number];
        if(p && p.hideW) {
            p.w = p.hideW;
            delete p.hideW;
            this.renderer.render(p);
            p.dom.focus();
        }
    }
    hide(number) {
        const p = this.portlets[number];
        if(p) {
            p.hideW = p.w;
            p.w = 0;
            this.renderer.render(p);
            p.dom.blur();
        }
    }
    showPortletNumbers() {
        // TODO
    }
};

const GeometryCalculator = class {
    calculateLocation(portlet, direction, portlets) {        
        const result = [];
        const p1 = portlet;
        const p2 = this._findSecondTarget(p1, direction, portlets);
        
        if(!p2) return [];

        switch(direction) {
            case Direction.LEFT:
                result.push({ portlet: p1, x: p2.x, y: p1.y, w: p1.w, h: p1.h });
                result.push({ portlet: p2, x: p2.x+p1.w, y: p2.y, w: p2.w, h: p2.h });
                break;
            case Direction.UP:
                result.push({ portlet: p1, x: p1.x, y: p2.y, w: p1.w, h: p1.h });
                result.push({ portlet: p2, x: p2.x, y: p2.y+p1.h, w: p2.w, h: p2.h });
                break;
            case Direction.RIGHT:
                result.push({ portlet: p1, x: p1.x+p2.w, y: p1.y, w: p1.w, h: p1.h });
                result.push({ portlet: p2, x: p1.x, y: p2.y, w: p2.w, h: p2.h });
                break;
            case Direction.DOWN:
                result.push({ portlet: p1, x: p1.x, y: p1.y+p2.h, w: p1.w, h: p1.h });
                result.push({ portlet: p2, x: p2.x, y: p1.y, w: p2.w, h: p2.h });
                break;
            default: break;
        }

        return result;
    }
    _findSecondTarget(p1, direction, portlets) {
        let p2;
        for(const p of portlets) {
            if(p === p1) continue;

            let passedPolicy = false;
            switch(direction) {
                case Direction.LEFT:
                    const policy_hEqual_leftThan = p1.y === p.y && p1.h === p.h && p1.x > p.x;
                    passedPolicy = policy_hEqual_leftThan && (!p2 || p.x > p2.x);
                    break;
                case Direction.UP:
                    const policy_wEqual_upThan = p1.x === p.x && p1.w === p.w && p1.y > p.y;
                    passedPolicy = policy_wEqual_upThan && (!p2 || p.y > p2.y);
                    break;
                case Direction.RIGHT:
                    const policy_hEqual_rightThan = p1.y === p.y && p1.h === p.h && p1.x < p.x;
                    passedPolicy = policy_hEqual_rightThan && (!p2 || p.x < p2.x);
                    break;
                case Direction.DOWN:
                    const policy_wEqual_downThan = p1.x === p.x && p1.w === p.w && p1.y < p.y;
                    passedPolicy = policy_wEqual_downThan && (!p2 || p.y < p2.y);
                    break;
                default: return;
            }
            if(passedPolicy) p2 = p;
        }
        return p2;
    }
    calculateSize(portlet, direction, portlets, step = 1) {
        const result = [];
        const p = portlet;
        let stepW = 0, stepH = 0;

        switch(direction) {
            // sizeDown
            case Direction.LEFT:
                stepW = -step;
                result.push(...this._pullLeftOthers(p, portlets, stepW));
                break;
            case Direction.UP:
                stepH = -step;
                result.push(...this._pullUpOthers(p, portlets, stepH));
                break;

            // sizeUp
            case Direction.RIGHT:
                stepW = step;
                result.push(...this._pushRightOthers(p, portlets, stepW));
                break;
            case Direction.DOWN:
                stepH = step;
                result.push(...this._pushDownOthers(p, portlets, stepH));
                break;

            default: return [];
        }

        const sizeZero = !(p.w+stepW) || !(p.h+stepH);
        if(sizeZero) return [];
        else {
            result.push({ portlet: p, x: p.x, y: p.y, w: p.w+stepW, h: p.h+stepH });
            return result;
        }
    }
    _pullLeftOthers(p1, portlets, wu) {
        const result = [];
        for(const p2 of portlets) {
            if(p1 === p2) continue;

            if(p1.x < p2.x) {
                const collisionVertical = (p1.y <= p2.y && p1.y+p1.h > p2.y) || (p1.y < p2.y+p2.h && p1.y+p1.h >= p2.y+p2.h);
                if(collisionVertical) result.push({ portlet: p2, x: p2.x+wu, y: p2.y, w: p2.w, h: p2.h });
            }
        }
        return result;
    }
    _pullUpOthers(p1, portlets, hu) {
        const result = [];
        for(const p2 of portlets) {
            if(p1 === p2) continue;

            if(p1.y < p2.y) {
                const collisionHorizontal = (p1.x <= p2.x && p1.x+p1.w > p2.x) || (p1.x < p2.x+p2.w && p1.x+p1.w >= p2.x+p2.w);
                if(collisionHorizontal) result.push({ portlet: p2, x: p2.x, y: p2.y+hu, w: p2.w, h: p2.h });
            }
        }
        return result;
    }
    _pushRightOthers(p1, portlets, wu) {
        const result = [];
        for(const p2 of portlets) {
            if(p1 === p2) continue;
            
            if(p1.x < p2.x) {
                const collisionHorizontal = p1.x+p1.w+wu > p2.x;
                const collisionVertical = (p1.y >= p2.y && p1.y < p2.y+p2.h) || (p2.y >= p1.y && p2.y < p1.y+p1.h);
                if(collisionHorizontal && collisionVertical) {
                    result.push({ portlet: p2, x: p2.x+wu, y: p2.y, w: p2.w, h: p2.h });
                    result.push(...this._pushRightOthers(p2, portlets, wu));
                }
            }
        }
        return result;
    }
    _pushDownOthers(p1, portlets, hu) {
        const result = [];
        for(const p2 of portlets) {
            if(p1 === p2) continue;
            
            if(p1.y < p2.y) {
                const collisionHorizontal = (p1.x >= p2.x && p1.x < p2.x+p2.w) || (p2.x >= p1.x && p2.x < p1.x+p1.w);
                const collisionVertical = p1.y+p1.h+hu > p2.y;
                if(collisionHorizontal && collisionVertical) {
                    result.push({ portlet: p2, x: p2.x, y: p2.y+hu, w: p2.w, h: p2.h });
                    result.push(...this._pushDownOthers(p2, portlets, hu));
                }
            }
        }
        return result;
    }    
};

const AnimationSelector = class {
    get(type) {
        switch(type) {
            case AnimationSelector.type.TARGET: return new Animation();
            case AnimationSelector.type.OTHER:  return new Animation();
            default: err();
        }
    }
};
AnimationSelector.type = { TARGET: Symbol(), OTHER: Symbol() };

const Animation = class {
    constructor(duration = 500, timing = Animation.quad) {
        prop(this, { duration, timing });
    }
    start(dom, x, y, w, h) {
        prop(this, { dom, _goalX : x, _goalY : y, _goalW : w, _goalH : h });
        
        this._startX = parseFloat(dom.style.left);
        this._startY = parseFloat(dom.style.top);
        this._startW = parseFloat(dom.style.width);
        this._startH = parseFloat(dom.style.height);
        this._diffX = round2(this._goalX - this._startX);
        this._diffY = round2(this._goalY - this._startY);
        this._diffW = round2(this._goalW - this._startW);
        this._diffH = round2(this._goalH - this._startH);

        requestAnimationFrame(this._animate.bind(this));
    }    
    _animate(time) {
        if(!this._startTime) this._startTime = time;
        let timeFraction = (time - this._startTime) / this.duration;
        if(timeFraction > 1) timeFraction = 1;

        const progress = this.timing(timeFraction);

        this._subAnimate(this._startX, this._goalX, this._diffX, timeFraction, progress, 'left');
        this._subAnimate(this._startY, this._goalY, this._diffY, timeFraction, progress, 'top');
        this._subAnimate(this._startW, this._goalW, this._diffW, timeFraction, progress, 'width');
        this._subAnimate(this._startH, this._goalH, this._diffH, timeFraction, progress, 'height');
    }
    _subAnimate(start, goal, diff, timeFraction, progress, styleProp) {
        if(diff !== 0) {
            const newValue = round2(start + (diff * progress));
            
            if(timeFraction < 1) {
                this.dom.style[styleProp] = `${newValue}px`;
                requestAnimationFrame(this._animate.bind(this));
            } else
                this.dom.style[styleProp] = `${goal}px`;
        }
    }
}
Animation.linear = timeFraction => {
  return timeFraction;
};
Animation.quad = timeFraction => {
  return Math.pow(timeFraction, 2)
};

const Renderer = class {
    render(portlet, animation) {
        const p = portlet;
        if(!p.dom.style.cssText) p.dom.style.cssText = Portlet.cssText;

        p.dom.style.position = 'absolute';
        p.dom.style.boxSizing = 'border-box';

        const {unitW, unitH, margin} = p.parent;
        const x = round2(p.x*unitW + margin);
        const y = round2(p.y*unitH + margin);
        const w = !p.w ? 0 : round2(p.w*unitW - margin*2);
        const h = !p.h ? 0 : round2(p.h*unitH - margin*2);
        
        if(animation)
            animation.start(p.dom, x, y, w, h);
        else
            p.setStyle(x, y, w, h);
    }
};

const Portlet = class {
    constructor(x, y, w, h, dom) {
        prop(this, { x, y, w, h, dom });
        this.children = [];
        this.divideN = Portlet.divideN;
        this.margin = Portlet.margin;
        this._updateUnit(dom.style.width||window.innerWidth, dom.style.height||window.innerHeight);
    }
    location(x, y) {
        this.x = x;
        this.y = y;
    }
    size(w, h) {
        this.w = w;
        this.h = h;
    }
    append(p) {
        this.children.push(p);
        p.parent = this;
    }
    setStyle(left, top, width, height) {
        this.dom.style.left   = `${left}px`;
        this.dom.style.top    = `${top}px`;
        this.dom.style.width  = `${width}px`;
        this.dom.style.height = `${height}px`;

        this._updateUnit(width, height);
    }
    _updateUnit(width, height) {
        this.unitW = width / this.divideN;
        this.unitH = height / this.divideN;
    }
};
Portlet.divideN = 10;
Portlet.margin = 2;
Portlet.cssText = `
    box-shadow: 0 10px 6px -6px #777;
    border-radius: 3px 3px 0 0;
    background: #fff;
    overflow: hidden;
`;

return {
    start(options) {
        if(options && options.divideN) Portlet.divideN = options.divideN;
        if(options && options.margin) Portlet.margin = options.margin;
        if(options && options.cssText) Portlet.cssText = options.cssText;
        
        const pc = new PortletController(new KeyboardInputInterpreter(), new Portland(new GeometryCalculator(), new AnimationSelector(), new Renderer()));
        pc.initialize();
        
        return pc;
    }
};

})();