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

const add = (element, keys, callback) => {
    const capturing = element === window;

    element.addEventListener('keydown', e => {
        if(!capturing) e.stopPropagation();
        
        let ok = true;
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
                default:
                    if(k !== e.keyCode) ok = false;
                    break;
            }
        }        
        if(ok) {
            e.returnValue = false;
            callback();
        }
    }, capturing);
};

return { add, ...combinationKeys, ...directionKeys, ...numericKeys, ...englishKeys };

})();