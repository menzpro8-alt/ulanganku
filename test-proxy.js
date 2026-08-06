const { LocalStorage } = require('node-localstorage');
global.localStorage = new LocalStorage('./scratch-storage');

function createPersistentArray(key, initialData) {
  let data = initialData;
  return new Proxy(data, {
    set(target, property, value) {
      target[property] = value;
      try {
        localStorage.setItem(key, JSON.stringify(target));
      } catch (e) {}
      return true;
    }
  });
}

const arr = createPersistentArray('test', []);
arr.push({ id: 1 });
console.log(localStorage.getItem('test'));
