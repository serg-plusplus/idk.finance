function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object.keys(descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object.defineProperty(target, property, desc);
    desc = null;
  }

  return desc;
}

var PromiseResult;

(function (PromiseResult) {
  PromiseResult[PromiseResult["NotReady"] = 0] = "NotReady";
  PromiseResult[PromiseResult["Successful"] = 1] = "Successful";
  PromiseResult[PromiseResult["Failed"] = 2] = "Failed";
})(PromiseResult || (PromiseResult = {}));

var PromiseError;

(function (PromiseError) {
  PromiseError[PromiseError["Failed"] = 0] = "Failed";
  PromiseError[PromiseError["NotReady"] = 1] = "NotReady";
})(PromiseError || (PromiseError = {}));

function u8ArrayToBytes(array) {
  let ret = "";

  for (let e of array) {
    ret += String.fromCharCode(e);
  }

  return ret;
} // TODO this function is a bit broken and the type can't be string
// TODO for more info: https://github.com/near/near-sdk-js/issues/78

function bytesToU8Array(bytes) {
  let ret = new Uint8Array(bytes.length);

  for (let i = 0; i < bytes.length; i++) {
    ret[i] = bytes.charCodeAt(i);
  }

  return ret;
}

function assert(b, str) {
  if (b) {
    return;
  } else {
    throw Error("assertion failed: " + str);
  }
}

/*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function assertNumber(n) {
  if (!Number.isSafeInteger(n)) throw new Error(`Wrong integer: ${n}`);
}

function chain(...args) {
  const wrap = (a, b) => c => a(b(c));

  const encode = Array.from(args).reverse().reduce((acc, i) => acc ? wrap(acc, i.encode) : i.encode, undefined);
  const decode = args.reduce((acc, i) => acc ? wrap(acc, i.decode) : i.decode, undefined);
  return {
    encode,
    decode
  };
}

function alphabet(alphabet) {
  return {
    encode: digits => {
      if (!Array.isArray(digits) || digits.length && typeof digits[0] !== 'number') throw new Error('alphabet.encode input should be an array of numbers');
      return digits.map(i => {
        assertNumber(i);
        if (i < 0 || i >= alphabet.length) throw new Error(`Digit index outside alphabet: ${i} (alphabet: ${alphabet.length})`);
        return alphabet[i];
      });
    },
    decode: input => {
      if (!Array.isArray(input) || input.length && typeof input[0] !== 'string') throw new Error('alphabet.decode input should be array of strings');
      return input.map(letter => {
        if (typeof letter !== 'string') throw new Error(`alphabet.decode: not string element=${letter}`);
        const index = alphabet.indexOf(letter);
        if (index === -1) throw new Error(`Unknown letter: "${letter}". Allowed: ${alphabet}`);
        return index;
      });
    }
  };
}

function join(separator = '') {
  if (typeof separator !== 'string') throw new Error('join separator should be string');
  return {
    encode: from => {
      if (!Array.isArray(from) || from.length && typeof from[0] !== 'string') throw new Error('join.encode input should be array of strings');

      for (let i of from) if (typeof i !== 'string') throw new Error(`join.encode: non-string input=${i}`);

      return from.join(separator);
    },
    decode: to => {
      if (typeof to !== 'string') throw new Error('join.decode input should be string');
      return to.split(separator);
    }
  };
}

function padding(bits, chr = '=') {
  assertNumber(bits);
  if (typeof chr !== 'string') throw new Error('padding chr should be string');
  return {
    encode(data) {
      if (!Array.isArray(data) || data.length && typeof data[0] !== 'string') throw new Error('padding.encode input should be array of strings');

      for (let i of data) if (typeof i !== 'string') throw new Error(`padding.encode: non-string input=${i}`);

      while (data.length * bits % 8) data.push(chr);

      return data;
    },

    decode(input) {
      if (!Array.isArray(input) || input.length && typeof input[0] !== 'string') throw new Error('padding.encode input should be array of strings');

      for (let i of input) if (typeof i !== 'string') throw new Error(`padding.decode: non-string input=${i}`);

      let end = input.length;
      if (end * bits % 8) throw new Error('Invalid padding: string should have whole number of bytes');

      for (; end > 0 && input[end - 1] === chr; end--) {
        if (!((end - 1) * bits % 8)) throw new Error('Invalid padding: string has too much padding');
      }

      return input.slice(0, end);
    }

  };
}

function normalize(fn) {
  if (typeof fn !== 'function') throw new Error('normalize fn should be function');
  return {
    encode: from => from,
    decode: to => fn(to)
  };
}

function convertRadix(data, from, to) {
  if (from < 2) throw new Error(`convertRadix: wrong from=${from}, base cannot be less than 2`);
  if (to < 2) throw new Error(`convertRadix: wrong to=${to}, base cannot be less than 2`);
  if (!Array.isArray(data)) throw new Error('convertRadix: data should be array');
  if (!data.length) return [];
  let pos = 0;
  const res = [];
  const digits = Array.from(data);
  digits.forEach(d => {
    assertNumber(d);
    if (d < 0 || d >= from) throw new Error(`Wrong integer: ${d}`);
  });

  while (true) {
    let carry = 0;
    let done = true;

    for (let i = pos; i < digits.length; i++) {
      const digit = digits[i];
      const digitBase = from * carry + digit;

      if (!Number.isSafeInteger(digitBase) || from * carry / from !== carry || digitBase - digit !== from * carry) {
        throw new Error('convertRadix: carry overflow');
      }

      carry = digitBase % to;
      digits[i] = Math.floor(digitBase / to);
      if (!Number.isSafeInteger(digits[i]) || digits[i] * to + carry !== digitBase) throw new Error('convertRadix: carry overflow');
      if (!done) continue;else if (!digits[i]) pos = i;else done = false;
    }

    res.push(carry);
    if (done) break;
  }

  for (let i = 0; i < data.length - 1 && data[i] === 0; i++) res.push(0);

  return res.reverse();
}

const gcd = (a, b) => !b ? a : gcd(b, a % b);

const radix2carry = (from, to) => from + (to - gcd(from, to));

function convertRadix2(data, from, to, padding) {
  if (!Array.isArray(data)) throw new Error('convertRadix2: data should be array');
  if (from <= 0 || from > 32) throw new Error(`convertRadix2: wrong from=${from}`);
  if (to <= 0 || to > 32) throw new Error(`convertRadix2: wrong to=${to}`);

  if (radix2carry(from, to) > 32) {
    throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${radix2carry(from, to)}`);
  }

  let carry = 0;
  let pos = 0;
  const mask = 2 ** to - 1;
  const res = [];

  for (const n of data) {
    assertNumber(n);
    if (n >= 2 ** from) throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
    carry = carry << from | n;
    if (pos + from > 32) throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
    pos += from;

    for (; pos >= to; pos -= to) res.push((carry >> pos - to & mask) >>> 0);

    carry &= 2 ** pos - 1;
  }

  carry = carry << to - pos & mask;
  if (!padding && pos >= from) throw new Error('Excess padding');
  if (!padding && carry) throw new Error(`Non-zero padding: ${carry}`);
  if (padding && pos > 0) res.push(carry >>> 0);
  return res;
}

function radix(num) {
  assertNumber(num);
  return {
    encode: bytes => {
      if (!(bytes instanceof Uint8Array)) throw new Error('radix.encode input should be Uint8Array');
      return convertRadix(Array.from(bytes), 2 ** 8, num);
    },
    decode: digits => {
      if (!Array.isArray(digits) || digits.length && typeof digits[0] !== 'number') throw new Error('radix.decode input should be array of strings');
      return Uint8Array.from(convertRadix(digits, num, 2 ** 8));
    }
  };
}

function radix2(bits, revPadding = false) {
  assertNumber(bits);
  if (bits <= 0 || bits > 32) throw new Error('radix2: bits should be in (0..32]');
  if (radix2carry(8, bits) > 32 || radix2carry(bits, 8) > 32) throw new Error('radix2: carry overflow');
  return {
    encode: bytes => {
      if (!(bytes instanceof Uint8Array)) throw new Error('radix2.encode input should be Uint8Array');
      return convertRadix2(Array.from(bytes), 8, bits, !revPadding);
    },
    decode: digits => {
      if (!Array.isArray(digits) || digits.length && typeof digits[0] !== 'number') throw new Error('radix2.decode input should be array of strings');
      return Uint8Array.from(convertRadix2(digits, bits, 8, revPadding));
    }
  };
}

function unsafeWrapper(fn) {
  if (typeof fn !== 'function') throw new Error('unsafeWrapper fn should be function');
  return function (...args) {
    try {
      return fn.apply(null, args);
    } catch (e) {}
  };
}
const base16 = chain(radix2(4), alphabet('0123456789ABCDEF'), join(''));
const base32 = chain(radix2(5), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'), padding(5), join(''));
chain(radix2(5), alphabet('0123456789ABCDEFGHIJKLMNOPQRSTUV'), padding(5), join(''));
chain(radix2(5), alphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZ'), join(''), normalize(s => s.toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1')));
const base64 = chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'), padding(6), join(''));
const base64url = chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'), padding(6), join(''));

const genBase58 = abc => chain(radix(58), alphabet(abc), join(''));

const base58 = genBase58('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');
genBase58('123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ');
genBase58('rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz');
const XMR_BLOCK_LEN = [0, 2, 3, 5, 6, 7, 9, 10, 11];
const base58xmr = {
  encode(data) {
    let res = '';

    for (let i = 0; i < data.length; i += 8) {
      const block = data.subarray(i, i + 8);
      res += base58.encode(block).padStart(XMR_BLOCK_LEN[block.length], '1');
    }

    return res;
  },

  decode(str) {
    let res = [];

    for (let i = 0; i < str.length; i += 11) {
      const slice = str.slice(i, i + 11);
      const blockLen = XMR_BLOCK_LEN.indexOf(slice.length);
      const block = base58.decode(slice);

      for (let j = 0; j < block.length - blockLen; j++) {
        if (block[j] !== 0) throw new Error('base58xmr: wrong padding');
      }

      res = res.concat(Array.from(block.slice(block.length - blockLen)));
    }

    return Uint8Array.from(res);
  }

};
const BECH_ALPHABET = chain(alphabet('qpzry9x8gf2tvdw0s3jn54khce6mua7l'), join(''));
const POLYMOD_GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function bech32Polymod(pre) {
  const b = pre >> 25;
  let chk = (pre & 0x1ffffff) << 5;

  for (let i = 0; i < POLYMOD_GENERATORS.length; i++) {
    if ((b >> i & 1) === 1) chk ^= POLYMOD_GENERATORS[i];
  }

  return chk;
}

function bechChecksum(prefix, words, encodingConst = 1) {
  const len = prefix.length;
  let chk = 1;

  for (let i = 0; i < len; i++) {
    const c = prefix.charCodeAt(i);
    if (c < 33 || c > 126) throw new Error(`Invalid prefix (${prefix})`);
    chk = bech32Polymod(chk) ^ c >> 5;
  }

  chk = bech32Polymod(chk);

  for (let i = 0; i < len; i++) chk = bech32Polymod(chk) ^ prefix.charCodeAt(i) & 0x1f;

  for (let v of words) chk = bech32Polymod(chk) ^ v;

  for (let i = 0; i < 6; i++) chk = bech32Polymod(chk);

  chk ^= encodingConst;
  return BECH_ALPHABET.encode(convertRadix2([chk % 2 ** 30], 30, 5, false));
}

function genBech32(encoding) {
  const ENCODING_CONST = encoding === 'bech32' ? 1 : 0x2bc830a3;

  const _words = radix2(5);

  const fromWords = _words.decode;
  const toWords = _words.encode;
  const fromWordsUnsafe = unsafeWrapper(fromWords);

  function encode(prefix, words, limit = 90) {
    if (typeof prefix !== 'string') throw new Error(`bech32.encode prefix should be string, not ${typeof prefix}`);
    if (!Array.isArray(words) || words.length && typeof words[0] !== 'number') throw new Error(`bech32.encode words should be array of numbers, not ${typeof words}`);
    const actualLength = prefix.length + 7 + words.length;
    if (limit !== false && actualLength > limit) throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
    prefix = prefix.toLowerCase();
    return `${prefix}1${BECH_ALPHABET.encode(words)}${bechChecksum(prefix, words, ENCODING_CONST)}`;
  }

  function decode(str, limit = 90) {
    if (typeof str !== 'string') throw new Error(`bech32.decode input should be string, not ${typeof str}`);
    if (str.length < 8 || limit !== false && str.length > limit) throw new TypeError(`Wrong string length: ${str.length} (${str}). Expected (8..${limit})`);
    const lowered = str.toLowerCase();
    if (str !== lowered && str !== str.toUpperCase()) throw new Error(`String must be lowercase or uppercase`);
    str = lowered;
    const sepIndex = str.lastIndexOf('1');
    if (sepIndex === 0 || sepIndex === -1) throw new Error(`Letter "1" must be present between prefix and data only`);
    const prefix = str.slice(0, sepIndex);

    const _words = str.slice(sepIndex + 1);

    if (_words.length < 6) throw new Error('Data must be at least 6 characters long');
    const words = BECH_ALPHABET.decode(_words).slice(0, -6);
    const sum = bechChecksum(prefix, words, ENCODING_CONST);
    if (!_words.endsWith(sum)) throw new Error(`Invalid checksum in ${str}: expected "${sum}"`);
    return {
      prefix,
      words
    };
  }

  const decodeUnsafe = unsafeWrapper(decode);

  function decodeToBytes(str) {
    const {
      prefix,
      words
    } = decode(str, false);
    return {
      prefix,
      words,
      bytes: fromWords(words)
    };
  }

  return {
    encode,
    decode,
    decodeToBytes,
    decodeUnsafe,
    fromWords,
    fromWordsUnsafe,
    toWords
  };
}

genBech32('bech32');
genBech32('bech32m');
const utf8 = {
  encode: data => new TextDecoder().decode(data),
  decode: str => new TextEncoder().encode(str)
};
const hex = chain(radix2(4), alphabet('0123456789abcdef'), join(''), normalize(s => {
  if (typeof s !== 'string' || s.length % 2) throw new TypeError(`hex.decode: expected string, got ${typeof s} with length ${s.length}`);
  return s.toLowerCase();
}));
const CODERS = {
  utf8,
  hex,
  base16,
  base32,
  base64,
  base64url,
  base58,
  base58xmr
};
`Invalid encoding type. Available types: ${Object.keys(CODERS).join(', ')}`;

var CurveType;

(function (CurveType) {
  CurveType[CurveType["ED25519"] = 0] = "ED25519";
  CurveType[CurveType["SECP256K1"] = 1] = "SECP256K1";
})(CurveType || (CurveType = {}));

const U64_MAX = 2n ** 64n - 1n;
const EVICTED_REGISTER = U64_MAX - 1n;
function log(...params) {
  env.log(`${params.map(x => x === undefined ? 'undefined' : x) // Stringify undefined
  .map(x => typeof x === 'object' ? JSON.stringify(x) : x) // Convert Objects to strings
  .join(' ')}` // Convert to string
  );
}
function predecessorAccountId() {
  env.predecessor_account_id(0);
  return env.read_register(0);
}
function blockTimestamp() {
  return env.block_timestamp();
}
function attachedDeposit() {
  return env.attached_deposit();
}
function storageRead(key) {
  let ret = env.storage_read(key, 0);

  if (ret === 1n) {
    return env.read_register(0);
  } else {
    return null;
  }
}
function storageHasKey(key) {
  let ret = env.storage_has_key(key);

  if (ret === 1n) {
    return true;
  } else {
    return false;
  }
}
function storageGetEvicted() {
  return env.read_register(EVICTED_REGISTER);
}
function currentAccountId() {
  env.current_account_id(0);
  return env.read_register(0);
}
function input() {
  env.input(0);
  return env.read_register(0);
}
function promiseBatchCreate(accountId) {
  return env.promise_batch_create(accountId);
}
function promiseBatchActionTransfer(promiseIndex, amount) {
  env.promise_batch_action_transfer(promiseIndex, amount);
}
function storageWrite(key, value) {
  let exist = env.storage_write(key, value, EVICTED_REGISTER);

  if (exist === 1n) {
    return true;
  }

  return false;
}
function storageRemove(key) {
  let exist = env.storage_remove(key, EVICTED_REGISTER);

  if (exist === 1n) {
    return true;
  }

  return false;
}

function initialize({}) {
  return function (target, key, descriptor) {};
}
function call({
  privateFunction = false,
  payableFunction = false
}) {
  return function (target, key, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args) {
      if (privateFunction && predecessorAccountId() !== currentAccountId()) {
        throw Error("Function is private");
      }

      if (!payableFunction && attachedDeposit() > BigInt(0)) {
        throw Error("Function is not payable");
      }

      return originalMethod.apply(this, args);
    };
  };
}
function view({}) {
  return function (target, key, descriptor) {};
}
function NearBindgen({
  requireInit = false
}) {
  return target => {
    return class extends target {
      static _create() {
        return new target();
      }

      static _getState() {
        const rawState = storageRead("STATE");
        return rawState ? this._deserialize(rawState) : null;
      }

      static _saveToStorage(obj) {
        storageWrite("STATE", this._serialize(obj));
      }

      static _getArgs() {
        return JSON.parse(input() || "{}");
      }

      static _serialize(value) {
        return JSON.stringify(value);
      }

      static _deserialize(value) {
        return JSON.parse(value);
      }

      static _reconstruct(classObject, plainObject) {
        for (const item in classObject) {
          if (classObject[item].constructor?.deserialize !== undefined) {
            classObject[item] = classObject[item].constructor.deserialize(plainObject[item]);
          } else {
            classObject[item] = plainObject[item];
          }
        }

        return classObject;
      }

      static _requireInit() {
        return requireInit;
      }

    };
  };
}

class LookupMap {
  constructor(keyPrefix) {
    this.keyPrefix = keyPrefix;
  }

  containsKey(key) {
    let storageKey = this.keyPrefix + JSON.stringify(key);
    return storageHasKey(storageKey);
  }

  get(key) {
    let storageKey = this.keyPrefix + JSON.stringify(key);
    let raw = storageRead(storageKey);

    if (raw !== null) {
      return JSON.parse(raw);
    }

    return null;
  }

  remove(key) {
    let storageKey = this.keyPrefix + JSON.stringify(key);

    if (storageRemove(storageKey)) {
      return JSON.parse(storageGetEvicted());
    }

    return null;
  }

  set(key, value) {
    let storageKey = this.keyPrefix + JSON.stringify(key);
    let storageValue = JSON.stringify(value);

    if (storageWrite(storageKey, storageValue)) {
      return JSON.parse(storageGetEvicted());
    }

    return null;
  }

  extend(objects) {
    for (let kv of objects) {
      this.set(kv[0], kv[1]);
    }
  }

  serialize() {
    return JSON.stringify(this);
  } // converting plain object to class object


  static deserialize(data) {
    return new LookupMap(data.keyPrefix);
  }

}

const ERR_INDEX_OUT_OF_BOUNDS = "Index out of bounds";
const ERR_INCONSISTENT_STATE$1 = "The collection is an inconsistent state. Did previous smart contract execution terminate unexpectedly?";

function indexToKey(prefix, index) {
  let data = new Uint32Array([index]);
  let array = new Uint8Array(data.buffer);
  let key = u8ArrayToBytes(array);
  return prefix + key;
} /// An iterable implementation of vector that stores its content on the trie.
/// Uses the following map: index -> element


class Vector {
  constructor(prefix) {
    this.length = 0;
    this.prefix = prefix;
  }

  isEmpty() {
    return this.length == 0;
  }

  get(index) {
    if (index >= this.length) {
      return null;
    }

    let storageKey = indexToKey(this.prefix, index);
    return JSON.parse(storageRead(storageKey));
  } /// Removes an element from the vector and returns it in serialized form.
  /// The removed element is replaced by the last element of the vector.
  /// Does not preserve ordering, but is `O(1)`.


  swapRemove(index) {
    if (index >= this.length) {
      throw new Error(ERR_INDEX_OUT_OF_BOUNDS);
    } else if (index + 1 == this.length) {
      return this.pop();
    } else {
      let key = indexToKey(this.prefix, index);
      let last = this.pop();

      if (storageWrite(key, JSON.stringify(last))) {
        return JSON.parse(storageGetEvicted());
      } else {
        throw new Error(ERR_INCONSISTENT_STATE$1);
      }
    }
  }

  push(element) {
    let key = indexToKey(this.prefix, this.length);
    this.length += 1;
    storageWrite(key, JSON.stringify(element));
  }

  pop() {
    if (this.isEmpty()) {
      return null;
    } else {
      let lastIndex = this.length - 1;
      let lastKey = indexToKey(this.prefix, lastIndex);
      this.length -= 1;

      if (storageRemove(lastKey)) {
        return JSON.parse(storageGetEvicted());
      } else {
        throw new Error(ERR_INCONSISTENT_STATE$1);
      }
    }
  }

  replace(index, element) {
    if (index >= this.length) {
      throw new Error(ERR_INDEX_OUT_OF_BOUNDS);
    } else {
      let key = indexToKey(this.prefix, index);

      if (storageWrite(key, JSON.stringify(element))) {
        return JSON.parse(storageGetEvicted());
      } else {
        throw new Error(ERR_INCONSISTENT_STATE$1);
      }
    }
  }

  extend(elements) {
    for (let element of elements) {
      this.push(element);
    }
  }

  [Symbol.iterator]() {
    return new VectorIterator(this);
  }

  clear() {
    for (let i = 0; i < this.length; i++) {
      let key = indexToKey(this.prefix, i);
      storageRemove(key);
    }

    this.length = 0;
  }

  toArray() {
    let ret = [];

    for (let v of this) {
      ret.push(v);
    }

    return ret;
  }

  serialize() {
    return JSON.stringify(this);
  } // converting plain object to class object


  static deserialize(data) {
    let vector = new Vector(data.prefix);
    vector.length = data.length;
    return vector;
  }

}
class VectorIterator {
  constructor(vector) {
    this.current = 0;
    this.vector = vector;
  }

  next() {
    if (this.current < this.vector.length) {
      let value = this.vector.get(this.current);
      this.current += 1;
      return {
        value,
        done: false
      };
    }

    return {
      value: null,
      done: true
    };
  }

}

const ERR_INCONSISTENT_STATE = "The collection is an inconsistent state. Did previous smart contract execution terminate unexpectedly?";

function serializeIndex(index) {
  let data = new Uint32Array([index]);
  let array = new Uint8Array(data.buffer);
  return u8ArrayToBytes(array);
}

function deserializeIndex(rawIndex) {
  let array = bytesToU8Array(rawIndex);
  let data = new Uint32Array(array.buffer);
  return data[0];
}

class UnorderedSet {
  constructor(prefix) {
    this.prefix = prefix;
    this.elementIndexPrefix = prefix + "i";
    let elementsPrefix = prefix + "e";
    this.elements = new Vector(elementsPrefix);
  }

  get length() {
    return this.elements.length;
  }

  isEmpty() {
    return this.elements.isEmpty();
  }

  contains(element) {
    let indexLookup = this.elementIndexPrefix + JSON.stringify(element);
    return storageHasKey(indexLookup);
  }

  set(element) {
    let indexLookup = this.elementIndexPrefix + JSON.stringify(element);

    if (storageRead(indexLookup)) {
      return false;
    } else {
      let nextIndex = this.length;
      let nextIndexRaw = serializeIndex(nextIndex);
      storageWrite(indexLookup, nextIndexRaw);
      this.elements.push(element);
      return true;
    }
  }

  remove(element) {
    let indexLookup = this.elementIndexPrefix + JSON.stringify(element);
    let indexRaw = storageRead(indexLookup);

    if (indexRaw) {
      if (this.length == 1) {
        // If there is only one element then swap remove simply removes it without
        // swapping with the last element.
        storageRemove(indexLookup);
      } else {
        // If there is more than one element then swap remove swaps it with the last
        // element.
        let lastElement = this.elements.get(this.length - 1);

        if (!lastElement) {
          throw new Error(ERR_INCONSISTENT_STATE);
        }

        storageRemove(indexLookup); // If the removed element was the last element from keys, then we don't need to
        // reinsert the lookup back.

        if (lastElement != element) {
          let lastLookupElement = this.elementIndexPrefix + JSON.stringify(lastElement);
          storageWrite(lastLookupElement, indexRaw);
        }
      }

      let index = deserializeIndex(indexRaw);
      this.elements.swapRemove(index);
      return true;
    }

    return false;
  }

  clear() {
    for (let element of this.elements) {
      let indexLookup = this.elementIndexPrefix + JSON.stringify(element);
      storageRemove(indexLookup);
    }

    this.elements.clear();
  }

  toArray() {
    let ret = [];

    for (let v of this) {
      ret.push(v);
    }

    return ret;
  }

  [Symbol.iterator]() {
    return this.elements[Symbol.iterator]();
  }

  extend(elements) {
    for (let element of elements) {
      this.set(element);
    }
  }

  serialize() {
    return JSON.stringify(this);
  } // converting plain object to class object


  static deserialize(data) {
    let set = new UnorderedSet(data.prefix); // reconstruct Vector

    let elementsPrefix = data.prefix + "e";
    set.elements = new Vector(elementsPrefix);
    set.elements.length = data.elements.length;
    return set;
  }

}

let Position;

(function (Position) {
  Position[Position["None"] = 0] = "None";
  Position[Position["Bearish"] = 1] = "Bearish";
  Position[Position["Bullish"] = 2] = "Bullish";
})(Position || (Position = {}));

class BetInfo {
  constructor(position, amount, claimed) {
    this.position = position;
    this.amount = amount;
    this.claimed = claimed;
  }

}

class Round {
  constructor(epoch, startTimestamp, lockTimestamp, closeTimestamp, lockPrice, closePrice, totalAmount, bullAmount, bearAmount, rewardBaseCalAmount, rewardAmount, oracleCalled) {
    this.epoch = epoch;
    this.startTimestamp = startTimestamp;
    this.lockTimestamp = lockTimestamp;
    this.closeTimestamp = closeTimestamp;
    this.lockPrice = lockPrice;
    this.closePrice = closePrice;
    this.totalAmount = totalAmount;
    this.bullAmount = bullAmount;
    this.bearAmount = bearAmount;
    this.rewardBaseCalAmount = rewardBaseCalAmount;
    this.rewardAmount = rewardAmount;
    this.oracleCalled = oracleCalled;
  }

}

var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _class, _class2;
let PredictionMarket = (_dec = NearBindgen({}), _dec2 = initialize({}), _dec3 = view({}), _dec4 = view({}), _dec5 = call({
  payableFunction: true
}), _dec6 = call({}), _dec7 = call({}), _dec8 = call({}), _dec9 = call({}), _dec10 = call({}), _dec11 = call({}), _dec12 = call({}), _dec13 = call({}), _dec14 = call({}), _dec15 = call({}), _dec16 = call({}), _dec17 = view({}), _dec(_class = (_class2 = class PredictionMarket {
  owner = "admin.idk.near";
  pendingOwner = "";
  manager = "manager.idk.near";
  oracle = "oracleprice.near";
  assetId = "wrap.near";
  minBid = "1000";
  duration = "1800";
  feeRate = "10";
  feePrecision = "1000";
  feeTreasury = "0";
  _temporary_price = "0";
  currentEpoch = 0;
  bids = new LookupMap("b");
  rounds = new LookupMap("r");
  userRounds = new LookupMap("u");

  init({
    owner,
    manager
  }) {
    this.owner = owner;
    this.manager = manager;
  } // VIEW


  getState() {
    return {
      genesisLockOnce: this.genesisLockOnce,
      genesisStartOnce: this.genesisStartOnce,
      owner: this.owner,
      pendingOwner: this.pendingOwner,
      manager: this.manager,
      oracle: this.oracle,
      assetId: this.assetId,
      minBid: this.minBid.toString(),
      duration: this.duration.toString(),
      feeRate: this.feeRate.toString(),
      feePrecision: this.feePrecision.toString(),
      feeTreasury: this.feeTreasury.toString(),
      currentEpoch: this.currentEpoch
    };
  }

  getRound({
    epoch
  }) {
    return this.rounds.get(epoch.toString());
  } // PUBLIC


  bet({
    epoch,
    position
  }) {
    assert(epoch == this.currentEpoch, "Wrong epoch"); // check bettable round

    assert(attachedDeposit() >= BigInt(this.minBid), "Bid is too low"); // check bid only once per round

    const amount = attachedDeposit();

    let round = this._getRound(epoch);

    round.totalAmount = (BigInt(round.totalAmount) + amount).toString();

    if (position == Position.Bearish) {
      round.bearAmount = (BigInt(round.bearAmount) + amount).toString();
    } else {
      round.bullAmount = (BigInt(round.bullAmount) + amount).toString();
    }

    const sender = predecessorAccountId();

    const userRounds = this._getUserRounds(sender);

    let betInfo = this._getBetInfo(epoch, sender);

    betInfo.position = position;
    betInfo.amount = amount;
    userRounds.set(epoch);

    this._setBetInfo(epoch, sender, betInfo);

    this._setUserRounds(sender, userRounds);

    log(`${sender} bids in the ${epoch} epoch. Amount is ${amount}`);
  }

  claim({
    epochs
  }) {
    let reward = BigInt(0);
    const sender = predecessorAccountId();

    for (let epoch of epochs) {
      let round = this._getRound(epoch);

      assert(BigInt(round.startTimestamp) != BigInt(0), "Round isn't started");
      assert(BigInt(round.closeTimestamp) < blockTimestamp(), "Round isn't ended");
      assert(round.oracleCalled, "Oracle isn't called");
      assert(this.claimable(epoch, sender), "Not eligible");

      let betInfo = this._getBetInfo(epoch, sender);

      const epochReward = betInfo.amount * BigInt(round.rewardAmount) / BigInt(round.rewardBaseCalAmount);
      reward += epochReward;
      betInfo.claimed = true;

      this._setBetInfo(epoch, sender, betInfo);

      log(`${sender} claimed ${epochReward} for ${epoch} round.`);
    }

    if (reward > 0) {
      this._safeTransfer(sender, reward);
    }
  }

  reveal({}) {
    assert(this.genesisLockOnce && this.genesisStartOnce, "Genesis rounds aren't finished");

    let price = this._getPrice();

    this._safeLockRound(this.currentEpoch, price);

    this._safeEndRound(this.currentEpoch - 1, price);

    this._calculateRewards(this.currentEpoch - 1);

    this.currentEpoch += 1;

    this._safeStartRound(this.currentEpoch);
  }

  genesisStartRound({}) {
    assert(!this.genesisStartOnce, "Genesis round is started");
    this.currentEpoch += 1;

    this._startRound(this.currentEpoch);

    this.genesisStartOnce = true;
  }

  genesisLockRound({}) {
    assert(this.genesisStartOnce, "Genesis round is not started");
    assert(!this.genesisLockOnce, "Genesis round is locked");

    let price = this._getPrice();

    this._safeLockRound(this.currentEpoch, price);

    this.currentEpoch += 1;

    this._startRound(this.currentEpoch);

    this.genesisLockOnce = true;
  } // ADMIN


  setMinBid({
    minBid
  }) {
    this._assertOwner();

    BigInt(this.minBid);
    this.minBid = minBid;
  }

  setDuration({
    duration
  }) {
    this._assertOwner();

    BigInt(this.duration);
    this.duration = duration;
  }

  setFeeRate({
    feeRate
  }) {
    this._assertOwner();

    BigInt(this.feeRate);
    this.feeRate = feeRate;
  }

  setTemporaryPrice({
    newPrice
  }) {
    BigInt(newPrice);
    this._temporary_price = newPrice;
  }

  claimFee({
    receiver
  }) {
    this._assertOwner();

    this._safeTransfer(receiver, BigInt(this.feeTreasury));

    this.feeTreasury = "0";
  }

  transferOwnership({
    pendingOwner
  }) {
    this._assertOwner();

    this.pendingOwner = pendingOwner;
  }

  confirmTransferOwnership({}) {
    this._assertPendingOwner();

    this.owner = this.pendingOwner;
    this.pendingOwner = "";
  } // INTERNAL


  _calculateRewards(epoch) {
    let round = this._getRound(epoch);

    assert(BigInt(round.rewardBaseCalAmount) == BigInt(0) && BigInt(round.rewardAmount) == BigInt(0), "Reward calculated");
    let treasuryAmt;

    if (round.closePrice > round.lockPrice) {
      round.rewardBaseCalAmount = round.bullAmount;
      treasuryAmt = BigInt(round.totalAmount) * BigInt(this.feeRate) / BigInt(this.feePrecision);
      round.rewardAmount = (BigInt(round.totalAmount) - treasuryAmt).toString();
    } else if (round.closePrice < round.lockPrice) {
      round.rewardBaseCalAmount = round.bearAmount;
      treasuryAmt = BigInt(round.totalAmount) * BigInt(this.feeRate) / BigInt(this.feePrecision);
      round.rewardAmount = (BigInt(round.totalAmount) - treasuryAmt).toString();
    } else {
      round.rewardBaseCalAmount = "0";
      round.rewardAmount = "0";
      treasuryAmt = BigInt(round.totalAmount);
    }

    this.feeTreasury = (BigInt(this.feeTreasury) + treasuryAmt).toString();

    this._setRound(epoch, round);

    log(`Rewards for ${epoch} round calculated`);
  }

  _safeLockRound(epoch, price) {
    let round = this._getRound(epoch);

    assert(BigInt(round.startTimestamp) != BigInt(0), "Round n-1 is not started");
    assert(BigInt(round.lockTimestamp) < blockTimestamp(), "Lock is too early");
    round.closeTimestamp = (blockTimestamp() + BigInt(this.duration)).toString();
    round.lockPrice = price.toString();

    this._setRound(epoch, round);

    log(`The round ${epoch} locked`);
  }

  _safeEndRound(epoch, price) {
    let round = this._getRound(epoch);

    assert(BigInt(round.lockTimestamp) != BigInt(0), "Round n-1 is not started");
    assert(BigInt(round.closeTimestamp) < blockTimestamp(), "End is too early");
    round.closePrice = price.toString();
    round.oracleCalled = true;

    this._setRound(epoch, round);

    log(`The round ${epoch} closed`);
  }

  _safeStartRound(epoch) {
    let oldRound = this._getRound(epoch - 2);

    assert(this.genesisStartOnce, "Init game first");
    assert(BigInt(oldRound.closeTimestamp) != BigInt(0), "Round n-2 is not ended");
    assert(BigInt(oldRound.closeTimestamp) < blockTimestamp(), "Round n-2 is too young");

    this._startRound(epoch);
  }

  _startRound(epoch) {
    let round = new Round(epoch.toFixed(), blockTimestamp().toString(), (blockTimestamp() + BigInt(this.duration)).toString(), (blockTimestamp() + BigInt(2) * BigInt(this.duration)).toString(), "0", "0", "0", "0", "0", "0", "0", false);

    this._setRound(epoch, round);

    log(`The roumd ${epoch} started`);
  } // HELPERS


  _assertOwner() {
    assert(predecessorAccountId() == this.owner, "Not an owner");
  }

  _assertPendingOwner() {
    assert(predecessorAccountId() == this.pendingOwner, "Not an owner");
  }

  _getBetInfo(epoch, owner) {
    let betInfo = this.rounds.get(epoch.toString() + owner);

    if (betInfo === null) {
      return new BetInfo(Position.None, BigInt(0), false);
    }

    return new BetInfo(betInfo.position, betInfo.amount, betInfo.claimed);
  }

  _getUserRounds(owner) {
    let userRounds = this.userRounds.get(owner);

    if (userRounds === null) {
      return new UnorderedSet(owner);
    }

    return userRounds;
  }

  _getRound(epoch) {
    let round = this.rounds.get(epoch.toString());
    assert(round != null, "Round doesn't exist");
    return new Round(round.epoch, round.startTimestamp, round.lockTimestamp, round.closeTimestamp, round.lockPrice, round.closePrice, round.totalAmount, round.bullAmount, round.bearAmount, round.rewardBaseCalAmount, round.rewardAmount, round.oracleCalled);
  }

  _getPrice() {
    // TODO
    return BigInt(4.22);
  }

  _setBetInfo(epoch, owner, betInfo) {
    this.rounds.set(epoch.toString() + owner, betInfo);
  }

  _setRound(epoch, roumd) {
    this.rounds.set(epoch.toString(), roumd);
  }

  _setUserRounds(owner, userRounds) {
    this.userRounds.set(owner, userRounds);
  }

  _safeTransfer(receiver, amount) {
    const promise = promiseBatchCreate(receiver);
    promiseBatchActionTransfer(promise, amount);
  }

  claimable(epoch, owner) {
    let round = this._getRound(epoch);

    let betInfo = this._getBetInfo(epoch, owner);

    if (round.lockPrice == round.closePrice) {
      return false;
    }

    return round.oracleCalled && betInfo.amount != BigInt(0) && !betInfo.claimed && (BigInt(round.closePrice) > BigInt(round.lockPrice) && betInfo.position == Position.Bullish || BigInt(round.closePrice) < BigInt(round.lockPrice) && betInfo.position == Position.Bearish);
  }

}, (_applyDecoratedDescriptor(_class2.prototype, "init", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "init"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getState", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "getState"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getRound", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "getRound"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "bet", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "bet"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "claim", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "claim"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "reveal", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "reveal"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "genesisStartRound", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "genesisStartRound"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "genesisLockRound", [_dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "genesisLockRound"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "setMinBid", [_dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "setMinBid"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "setDuration", [_dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "setDuration"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "setFeeRate", [_dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "setFeeRate"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "setTemporaryPrice", [_dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "setTemporaryPrice"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "claimFee", [_dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "claimFee"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "transferOwnership", [_dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "transferOwnership"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "confirmTransferOwnership", [_dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "confirmTransferOwnership"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "claimable", [_dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "claimable"), _class2.prototype)), _class2)) || _class);
function claimable() {
  let _state = PredictionMarket._getState();

  if (!_state && PredictionMarket._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = PredictionMarket._create();

  if (_state) {
    PredictionMarket._reconstruct(_contract, _state);
  }

  let _args = PredictionMarket._getArgs();

  let _result = _contract.claimable(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(PredictionMarket._serialize(_result));
}
function confirmTransferOwnership() {
  let _state = PredictionMarket._getState();

  if (!_state && PredictionMarket._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = PredictionMarket._create();

  if (_state) {
    PredictionMarket._reconstruct(_contract, _state);
  }

  let _args = PredictionMarket._getArgs();

  let _result = _contract.confirmTransferOwnership(_args);

  PredictionMarket._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(PredictionMarket._serialize(_result));
}
function transferOwnership() {
  let _state = PredictionMarket._getState();

  if (!_state && PredictionMarket._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = PredictionMarket._create();

  if (_state) {
    PredictionMarket._reconstruct(_contract, _state);
  }

  let _args = PredictionMarket._getArgs();

  let _result = _contract.transferOwnership(_args);

  PredictionMarket._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(PredictionMarket._serialize(_result));
}
function claimFee() {
  let _state = PredictionMarket._getState();

  if (!_state && PredictionMarket._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = PredictionMarket._create();

  if (_state) {
    PredictionMarket._reconstruct(_contract, _state);
  }

  let _args = PredictionMarket._getArgs();

  let _result = _contract.claimFee(_args);

  PredictionMarket._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(PredictionMarket._serialize(_result));
}
function setTemporaryPrice() {
  let _state = PredictionMarket._getState();

  if (!_state && PredictionMarket._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = PredictionMarket._create();

  if (_state) {
    PredictionMarket._reconstruct(_contract, _state);
  }

  let _args = PredictionMarket._getArgs();

  let _result = _contract.setTemporaryPrice(_args);

  PredictionMarket._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(PredictionMarket._serialize(_result));
}
function setFeeRate() {
  let _state = PredictionMarket._getState();

  if (!_state && PredictionMarket._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = PredictionMarket._create();

  if (_state) {
    PredictionMarket._reconstruct(_contract, _state);
  }

  let _args = PredictionMarket._getArgs();

  let _result = _contract.setFeeRate(_args);

  PredictionMarket._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(PredictionMarket._serialize(_result));
}
function setDuration() {
  let _state = PredictionMarket._getState();

  if (!_state && PredictionMarket._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = PredictionMarket._create();

  if (_state) {
    PredictionMarket._reconstruct(_contract, _state);
  }

  let _args = PredictionMarket._getArgs();

  let _result = _contract.setDuration(_args);

  PredictionMarket._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(PredictionMarket._serialize(_result));
}
function setMinBid() {
  let _state = PredictionMarket._getState();

  if (!_state && PredictionMarket._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = PredictionMarket._create();

  if (_state) {
    PredictionMarket._reconstruct(_contract, _state);
  }

  let _args = PredictionMarket._getArgs();

  let _result = _contract.setMinBid(_args);

  PredictionMarket._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(PredictionMarket._serialize(_result));
}
function genesisLockRound() {
  let _state = PredictionMarket._getState();

  if (!_state && PredictionMarket._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = PredictionMarket._create();

  if (_state) {
    PredictionMarket._reconstruct(_contract, _state);
  }

  let _args = PredictionMarket._getArgs();

  let _result = _contract.genesisLockRound(_args);

  PredictionMarket._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(PredictionMarket._serialize(_result));
}
function genesisStartRound() {
  let _state = PredictionMarket._getState();

  if (!_state && PredictionMarket._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = PredictionMarket._create();

  if (_state) {
    PredictionMarket._reconstruct(_contract, _state);
  }

  let _args = PredictionMarket._getArgs();

  let _result = _contract.genesisStartRound(_args);

  PredictionMarket._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(PredictionMarket._serialize(_result));
}
function reveal() {
  let _state = PredictionMarket._getState();

  if (!_state && PredictionMarket._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = PredictionMarket._create();

  if (_state) {
    PredictionMarket._reconstruct(_contract, _state);
  }

  let _args = PredictionMarket._getArgs();

  let _result = _contract.reveal(_args);

  PredictionMarket._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(PredictionMarket._serialize(_result));
}
function claim() {
  let _state = PredictionMarket._getState();

  if (!_state && PredictionMarket._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = PredictionMarket._create();

  if (_state) {
    PredictionMarket._reconstruct(_contract, _state);
  }

  let _args = PredictionMarket._getArgs();

  let _result = _contract.claim(_args);

  PredictionMarket._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(PredictionMarket._serialize(_result));
}
function bet() {
  let _state = PredictionMarket._getState();

  if (!_state && PredictionMarket._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = PredictionMarket._create();

  if (_state) {
    PredictionMarket._reconstruct(_contract, _state);
  }

  let _args = PredictionMarket._getArgs();

  let _result = _contract.bet(_args);

  PredictionMarket._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(PredictionMarket._serialize(_result));
}
function getRound() {
  let _state = PredictionMarket._getState();

  if (!_state && PredictionMarket._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = PredictionMarket._create();

  if (_state) {
    PredictionMarket._reconstruct(_contract, _state);
  }

  let _args = PredictionMarket._getArgs();

  let _result = _contract.getRound(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(PredictionMarket._serialize(_result));
}
function getState() {
  let _state = PredictionMarket._getState();

  if (!_state && PredictionMarket._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = PredictionMarket._create();

  if (_state) {
    PredictionMarket._reconstruct(_contract, _state);
  }

  let _args = PredictionMarket._getArgs();

  let _result = _contract.getState(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(PredictionMarket._serialize(_result));
}
function init() {
  let _state = PredictionMarket._getState();

  if (_state) throw new Error("Contract already initialized");

  let _contract = PredictionMarket._create();

  let _args = PredictionMarket._getArgs();

  let _result = _contract.init(_args);

  PredictionMarket._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(PredictionMarket._serialize(_result));
}

export { bet, claim, claimFee, claimable, confirmTransferOwnership, genesisLockRound, genesisStartRound, getRound, getState, init, reveal, setDuration, setFeeRate, setMinBid, setTemporaryPrice, transferOwnership };
//# sourceMappingURL=prediction_market.js.map
