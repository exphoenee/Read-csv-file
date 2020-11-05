let Elem = {
  Create: function (parameters) {
    let tag = parameters.tag || "div";
    let attributes = parameters.attributes || {};
    let children = parameters.children || [];
    let eventStarter = parameters.eventStarter || null;
    let eventFunction = parameters.eventFunction || null;
    let content = parameters.content || null;

    let defaultParent = document.querySelector("body");
    let targetParent =
      typeof parameters.targetParent == "string"
        ? document.querySelector(parameters.targetParent)
        : typeof parameters.targetParent == "object"
        ? parameters.targetParent
        : defaultParent || defaultParent;

    console.log(targetParent);
    let elem = document.createElement(tag);

    for (let attr in attributes) {
      elem.setAttribute(attr, attributes[attr]);
    }

    for (let i in children) {
      let child = children[i];

      if (typeof child != "object") {
        child = document.createTextNode(child);
      }

      elem.appendChild(child);
    }

    if (content) {
      elem.innerHTML = content;
    }

    if (eventStarter && eventFunction) {
      elem.addEventListener(eventStarter, eventFunction);
    }

    return elem;
  },
};

document.body.appendChild(
  Elem.Create({
    tag: "div",
    attributes: { class: "dateFilter-Container", id: "dateFilter-Container" },
    children: [
      Elem.Create({
        tag: "div",
        attributes: { class: "beginDate-container", id: "beginDate-container" },
        children: [
          Elem.Create({
            tag: "label",
            attributes: {
              class: "beginDate-lable",
            },
            content: "Kezdő dátum: ",
          }),
          Elem.Create({
            tag: "input",
            attributes: {
              type: "date",
              class: "beginDate",
              id: "beginDate",
            },
            eventStarter: "change",
            eventFunction: function (e) {
              e.preventDefault();
              console.log(this.value);
            },
          }),
        ],
      }),
      Elem.Create({
        tag: "div",
        attributes: { class: "endDate-container", id: "endDate-container" },
        children: [
          Elem.Create({
            tag: "label",
            attributes: {
              class: "endDate-lable",
            },
            content: "Befejező dátum: ",
          }),
          Elem.Create({
            tag: "input",
            attributes: {
              type: "date",
              class: "endDate",
              id: "endDate",
            },
            eventStarter: "change",
            eventFunction: function (e) {
              e.preventDefault();
              console.log(this.value);
            },
          }),
        ],
      }),
    ],
  })
);
