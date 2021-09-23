let books = [
  {
    author: "Gipsz, Jakab",
    title: "A Jetik vándorlásai útvonalainak változása 1976-2020",
    year: 2021,
    category: "Book",
  },
  {
    author: "Horváth Géza",
    title: "A Jetik evolúciója",
    year: 2011,
    category: "Jeti",
  },
  {
    author: "Chuck Norris",
    title: "Jetik ölésének 99 módja",
    year: 1992,
    category: "Öléstan",
  },
  {
    author: "Jeti",
    title: "Chuck Norris ölés 100 módja",
    year: 1993,
    category: "Öléstan",
  },
];

let Elem = {
  noSpecChars: function (text, lowercase = false) {
    function replaceAll(string, search, replace) {
      return string.split(search).join(replace);
    }

    let specialChars = {
      é: "e",
      á: "a",
      ó: "o",
      ö: "o",
      ő: "o",
      ú: "u",
      ü: "u",
      ű: "u",
      í: "i",
      É: "E",
      Á: "A",
      Ó: "O",
      Ö: "O",
      Ő: "O",
      Ú: "U",
      Ü: "U",
      Ű: "U",
      Í: "I",
      " ": "-",
      "/": "-",
      ":": "-",
      ";": "-",
      "=": "-",
    };
    for (let char in specialChars) {
      text = replaceAll(text, char, specialChars[char]);
    }
    return lowercase ? text.toLowerCase() : text;
  },

  Create: function (parameters) {
    let tag = parameters.tag || "div";
    let attributes = parameters.attributes || {};
    let children = parameters.children || [];
    let eventStarter = parameters.eventStarter || null;
    let eventFunction = parameters.eventFunction || null;
    let content = parameters.content || null;
    let text = parameters.text || null;

    let targetParent =
      typeof parameters.targetParent == "string"
        ? document.querySelector(parameters.targetParent) ||
          document.getElementById(parameters.targetParent)
        : typeof parameters.targetParent == "object"
        ? parameters.targetParent
        : null;

    let elem = document.createElement(tag);

    for (let attr in attributes) {
      elem.setAttribute(
        attr,
        attr == "class" || attr == "id"
          ? this.noSpecChars(attributes[attr])
          : attributes[attr]
      );
    }

    for (let i in children) {
      let child = children[i];
      typeof child != "object"
        ? (child = document.createTextNode(child))
        : null;
      elem.appendChild(child);
    }

    content ? (elem.innerHTML = content) : null;
    text ? (elem.text = text) : null;

    eventStarter && eventFunction
      ? elem.addEventListener(eventStarter, eventFunction)
      : null;
    targetParent ? targetParent.appendChild(elem) : null;

    return elem;
  },
};
