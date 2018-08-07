const Shortcut = (_ => {

const combinationKeys = { CTRL: Symbol(), ALT: Symbol(), SHIFT: Symbol() };
const directionKeys = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40 }

const initKeys = (obj, startChar, endChar, prefix = '') => {
    const start = startChar.charCodeAt();
    const end = endChar.charCodeAt();

    for(let i = start; i <= end; i++)
        obj[prefix + String.fromCharCode(i)] = i;
};
const numericKeys = {};
const englishKeys = {};
initKeys(numericKeys, '0', '9', '_');
initKeys(englishKeys, 'A', 'Z');

const Groups = { NUMBER: numericKeys, ENGLISH: englishKeys, DIRECTION: directionKeys };

const applyEvent = (dom, keys, callback) => {
    const activeKeys = new Set();
    const capturing = dom === window;
    
    dom.addEventListener('keyup', e => {
        if(!capturing) e.stopPropagation();
        activeKeys.delete(e.keyCode);
    }, capturing);
    
    dom.addEventListener('keydown', e => {
        if(!capturing) e.stopPropagation();
        activeKeys.add(e.keyCode);
        
        let ok = true;
        let groupKey;
        for(const k of keys) {
            switch(true) {
                case k === combinationKeys.CTRL:
                    if(!e.ctrlKey) ok = false;
                    break;
                case k === combinationKeys.ALT:
                    if(!e.altKey) ok = false;
                    break;
                case k === combinationKeys.SHIFT:
                    if(!e.shiftKey) ok = false;
                    break;
                case is(k, Groups):
                    Object.entries(k).some(([k, v]) => { if(activeKeys.has(v)) return groupKey = [k.replace('_', ''), v]; });
                    if(!groupKey) ok = false;
                    break;
                default:
                    if(!activeKeys.has(k)) ok = false;
                    break;
            }
        }        
        if(ok) {
            e.returnValue = false;
            activeKeys.clear();
            
            if(groupKey)
                callback(groupKey[0], groupKey[1]);
            else
                callback();
        }
    }, capturing);
};

const executor = (target, keys, callback) => {
    switch(true) {
        case is(target, Array):
            target.forEach(v => executor(v, keys, callback));
            break;
        case is(target, Element):
            applyEvent(target.dom, keys, callback);
            break;
        default:
            applyEvent(target, keys, callback);
            break;
    }
};

const add = (target, keys, callback) => {
    executor(target, keys, callback);
};

return { add, ...combinationKeys, ...directionKeys, ...numericKeys, ...englishKeys, ...Groups };

})();