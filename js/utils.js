/**
 * Este script é parte do projeto LUX, código aberto em Domínio Público.
*/

function $(id) { return document.getElementById(id) }

function $$(selector) {
  var result = document.body.querySelectorAll(selector);
  return (result.length > 1) ? result : result[0];
}

function removeChildNodes(node) {
  while (node.firstChild) {
    removeChildNodes(node.firstChild);
    node.removeChild(node.firstChild);
  }
}

function getCSSproperty(elm, property) {
  return elm.style[property]
          || window.getComputedStyle(elm, null).getPropertyValue(property);
}

function once(fn, context) {
  var result;
  return function() {
    if (fn) {
      result = fn.apply(context || this, arguments);
      fn = null;
    }
    return result;
  };
}

function uCase(charCode) {
  return ((charCode-97 >>> 0 <= 25) || (charCode-224 >>> 0 <= 31)) ? charCode-32 : charCode;
}

function asciiVowel(charCode) {
  var code = uCase(charCode);
  if (code-192 >>> 0 <= 5) return 65; // A
  if (code-200 >>> 0 <= 3) return 69; // E
  if (code-204 >>> 0 <= 3) return 73; // I
  if (code-210 >>> 0 <= 4) return 79; // O
  if (code-217 >>> 0 <= 3) return 85; // U
  return charCode;
}