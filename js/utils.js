/**
 * Este script é parte do projeto LUX.
*/

function $(id) { return document.getElementById(id); }

/* function $$(selector) {
  // pesquisa elementos conforme 'CSS selector' então
  // transforma o container do tipo NodeList em Array
  var array = Array.prototype.slice.call(
                document.querySelectorAll(selector));
  // retorna único elemento ou array de elementos
  return (array.length == 1) ? array[0] : array;
} */

/* function removeChildNodes(node) {
  while (node.firstChild) {
    removeChildNodes(node.firstChild);
    node.removeChild(node.firstChild);
  }
} */

/* function getCSSproperty(elm, property) {
  return elm.style[property]
          || window.getComputedStyle(elm, null).getPropertyValue(property);
} */

/* function once(fn, context) {
  var result;
  return function() {
    if (fn) {
      result = fn.apply(context || this, arguments);
      fn = null;
    }
    return result;
  };
} */

/* function uCase(charCode) {
  return ((charCode-97 >>> 0 <= 25) || (charCode-224 >>> 0 <= 31)) ? charCode-32 : charCode;
} */

/* function asciiVowel(charCode) {
  var code = uCase(charCode);
  if (code-192 >>> 0 <= 5) return 65; // A
  if (code-200 >>> 0 <= 3) return 69; // E
  if (code-204 >>> 0 <= 3) return 73; // I
  if (code-210 >>> 0 <= 4) return 79; // O
  if (code-217 >>> 0 <= 3) return 85; // U
  return charCode;
} */

function binarySearch(array, key) {
  var lo = 0, hi = array.length - 1, mid, element;
  while (lo <= hi) {
    mid = ((lo + hi) >> 1);
    element = array[mid];
    if (element < key) {
      lo = mid + 1;
    } else if (element > key) {
      hi = mid - 1;
    } else {
      return mid;
    }
  }
  return -1;
}

function setDisabled(array, boolValue) {
  array.forEach( function (item) { item.disabled = boolValue; } );
}

function leftPad(text, size) {
  return " ".repeat( Math.max(0, size-text.length) ) + text;
}