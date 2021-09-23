let Elem = {
  noSpecChars: function (text, lowercase = false) {
    if (typeof text !== "string") {
      text = text.toString();
    }
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
    let dataset = parameters.dataset || {};
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

    for (let data in dataset) {
      elem.dataset[data] = dataset[data];
    }

    return elem;
  },
};

function uniqueID() {
  return Math.random().toString(36).substr(2, 9);
}

let inputAndLabel = {
  Create: function (parameters) {
    let tag = parameters.tag || "input";
    let type = parameters.type || null;
    let id = parameters.id || tag + "-" + uniqueID();
    let label = parameters.label || tag + "-" + "id";
    let labelLast = parameters.labelLast || false;
    let options = parameters.options || null;
    let checked = parameters.checked || false;

    let wrapperName = parameters.wrapperName || type;
    let wrapper = parameters.wrapper || true;

    let eventStarter = parameters.eventStarter;
    let eventFunction = parameters.eventFunction;

    let children = [
      Elem.Create({
        tag: "label",
        content: label,
        attributes: {
          class: wrapperName + "-label",
          for: id,
        },
      }),
      Elem.Create({
        tag: tag,
        attributes: {
          type: type,
          class: wrapperName + "-input",
          id: id,
          checked: checked,
        },
        children: options,
        eventStarter: wrapper ? eventStarter : null,
        eventFunction: wrapper ? eventFunction : null,
      }),
    ];

    labelLast ? children.reverse() : null;

    let complex = Elem.Create({
      tag: "div",
      attributes: {
        class: wrapperName + "-wrapper",
      },
      children: children,
    });

    return complex;
  },
};

class dataTable {
  constructor(parameters) {
    this.dataFile = parameters.dataFile;
    this.container = document.querySelector("." + parameters.containerID);
    this.tableController = null;
    this.table = document.createElement("table");
    this.settings = {
      columnShow: {},
      dateFilterColumns: parameters.dateFilterColumns,
      dateFilters: {
        beginDate: null,
        endDate: null,
        firstRecordDate: null,
        LastRecordDate: null,
      },
      textFilters: {},
      columnsToSummarize: parameters.columnsToSummarize,
      rowNumberOptions: [10, 25, 50, 100, 200, 500, 1000],
      page: 0,
      showRowNumber: 10,
      currencyNames: ["Ft", "EUR", "USD", "HUF", "CHF"],
      specialChars: {
        é: "e",
        á: "a",
        ó: "o",
        ö: "o",
        ő: "o",
        ú: "u",
        ü: "u",
        ű: "u",
        í: "i",
        " ": "_",
        É: "E",
        Á: "A",
        Ó: "O",
        Ö: "O",
        Ő: "O",
        Ú: "U",
        Ü: "U",
        Ű: "U",
        Í: "I",
      },
    };
    this.tableData = {
      header: {},
      body: [{}],
      footer: {},
      rowNumber: null,
      recordNumber: 0,
    };
  }

  init() {
    let that = this;
    this.sendRequest(
      function (CSVdata) {
        that.buildTableObject(CSVdata);
      },
      this.dataFile,
      "GET",
      false
    );
    this.renderTable();
    this.renderController();
  }

  sendRequest(
    callback,
    url,
    method = "GET",
    async = true,
    body = null,
    header = "text/plain"
  ) {
    let xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        callback(xhr.responseText);
      }
    };
    xhr.open(method, url, async);
    xhr.setRequestHeader("Content-Type", header);
    xhr.send(body);
  }

  renderController() {
    this.tableController = Elem.Create({
      tag: "div",
      attributes: { class: "tableController" },
      targetParent: this.container,
    });

    this.container.insertBefore(this.tableController, this.table);

    this.renderPageControl();
    this.dateFilter();
    this.renderColumnControl();
  }

  renderColumnFilter() {
    let that = this;
    let filters = {};

    for (let column in this.tableData.header) {
      let texts = [];
      for (let row of this.tableData.body) {
        let colValueKey = null;
        if (row[column].type === "string") {
          colValueKey = "cell";
        }
        if (!texts.includes(row[column][colValueKey]) && colValueKey) {
          texts.push(row[column].cell);
        }
      }

      if (texts.length > 0) {
        filters[column] = texts;

        let headerCell = document.getElementById(column);

        Elem.Create({
          tag: "select",
          attributes: { id: `${column}-textFilter` },
          targetParent: headerCell,
          children: generateOptionText(),
          eventStarter: "change",
          eventFunction: function (e) {
            e.preventDefault();
            that.settings.textFilters[column] = this.value;
            that.setMaxPage();
            that.renderTable();
          },
        });

        function generateOptionText() {
          texts.sort();
          texts.unshift("Nincs szűrés");

          let options = [];
          for (let text of texts) {
            let option = Elem.Create({
              tag: "option",
              content: text,
            });
            options.push(option);
          }
          return options;
        }
      }
    }
  }

  dateFilter() {
    /* ide több dátum filtert a parametersben megadott tömb szerint!*/
    let that = this;

    this.settings.dateFilters.filterText = Elem.Create({
      tag: "p",
      attributes: {
        class: "filterText",
        id: "filterText",
      },
      content: generateFilterText(),
    });

    function generateFilterText() {
      function dateToText(date) {
        let dateTxt = String(date);
        return (
          dateTxt.slice(0, 4) +
          ". " +
          dateTxt.slice(4, 6) +
          ". " +
          dateTxt.slice(6, 8) +
          "."
        );
      }
      let filterText =
        "Dátumszűrés: " +
        dateToText(that.settings.dateFilters.beginDate) +
        " - " +
        dateToText(that.settings.dateFilters.endDate);
      return filterText;
    }

    Elem.Create({
      tag: "div",
      attributes: {
        class: "dateFilterContainer",
        id: "dateFilterContainer",
      },
      targetParent: this.tableController,
      children: [
        inputAndLabel.Create({
          tag: "input",
          type: "date",
          id: "beginDate",
          label: "Kezdő dátum: ",
          eventStarter: "change",
          eventFunction: function (e) {
            e.preventDefault();
            let newBegintDate = Number(this.value.split("-").join(""));

            that.settings.dateFilters.beginDate =
              newBegintDate < that.settings.dateFilters.firstRecordDate
                ? that.settings.dateFilters.firstRecordDate
                : newBegintDate;

            that.settings.dateFilters.filterText.innerHTML =
              generateFilterText();
            that.renderTable();
          },
        }),
        inputAndLabel.Create({
          tag: "input",
          type: "date",
          id: "endDate",
          label: "Befejező dátum: ",
          eventStarter: "change",
          eventFunction: function (e) {
            e.preventDefault();
            let newEndDate = Number(this.value.split("-").join(""));

            that.settings.dateFilters.endDate =
              newEndDate > that.settings.dateFilters.LastRecordDate
                ? that.settings.dateFilters.LastRecordDate
                : newEndDate;

            that.settings.dateFilters.filterText.innerHTML =
              generateFilterText();
            that.renderTable();
          },
        }),
        that.settings.dateFilters.filterText,
      ],
    });
  }

  renderColumnControl() {
    let that = this;

    let columnCheckBoxes = [];
    for (let column in this.tableData.header) {
      columnCheckBoxes.push(
        inputAndLabel.Create({
          tag: "input",
          type: "checkbox",
          id: `${column}-checkbox`,
          checked: that.settings.columnShow[column],
          label: this.tableData.header[column].name,
          wrapperName: "columnFilter",
          labelLast: true,
          eventStarter: "click",
          eventFunction: function () {
            let selecetdColumn = that.table.querySelectorAll(
              "." + this.id.split("-")[0]
            );
            that.settings.columnShow[this.id] = this.checked;
            selecetdColumn.forEach((cell) => {
              if (!this.checked) {
                cell.classList.add("hide");
              } else {
                cell.classList.remove("hide");
              }
            });
          },
        })
      );
    }

    Elem.Create({
      tag: "div",
      attributes: {
        class: "checkBoxesContainer",
        id: "checkBoxesContainer",
      },
      targetParent: this.tableController,
      children: columnCheckBoxes,
    });
  }

  renderPageControl() {
    let that = this;

    function generateOptionText() {
      that.settings.rowNumberOptions.push(that.tableData.allRecordNumber);
      let options = [];
      for (let rowNumberOption of that.settings.rowNumberOptions) {
        if (rowNumberOption <= that.tableData.allRecordNumber) {
          let text;
          text =
            rowNumberOption !== that.tableData.allRecordNumber
              ? rowNumberOption
              : "összes";
          text += " sor";

          let option = Elem.Create({
            tag: "option",
            content: text,
            attributes: { value: rowNumberOption },
          });
          options.push(option);
        }
      }
      return options;
    }

    function generatePageText() {
      let text = `${that.settings.page + 1}. oldal a(z) ${
        that.settings.maxPage + 1
      } oldalból`;

      return text;
    }

    this.settings.pageNumberText = Elem.Create({
      tag: "p",
      attributes: { id: "siteNumber" },
      content: generatePageText(),
    });

    Elem.Create({
      tag: "div",
      attributes: { class: "selectContainer" },
      targetParent: this.tableController,
      children: [
        inputAndLabel.Create({
          tag: "select",
          label: "Sorok száma: ",
          id: "rowNumberSelect",
          options: generateOptionText(),
          eventStarter: "change",
          eventFunction: function (e) {
            e.preventDefault();
            let currentRow = that.settings.showRowNumber * that.settings.page;
            that.settings.showRowNumber = Number(this.value);
            that.settings.page = Math.floor(
              currentRow / that.settings.showRowNumber
            );
            that.setMaxPage();
            that.settings.pageNumberText.innerHTML = generatePageText();
            that.renderTable();
          },
        }),
        Elem.Create({
          tag: "button",
          attributes: { id: "prevPage" },
          content: "Előző",
          eventStarter: "click",
          eventFunction: function (e) {
            e.preventDefault();
            that.settings.page--;
            that.settings.page < 0 ? (that.settings.page = 0) : null;
            that.settings.pageNumberText.innerHTML = generatePageText();
            that.renderTable();
          },
        }),
        Elem.Create({
          tag: "button",
          attributes: { id: "nextPage" },
          content: "Következő",
          eventStarter: "click",
          eventFunction: function (e) {
            e.preventDefault();
            that.settings.page++;
            that.settings.page > that.settings.maxPage
              ? (that.settings.page = that.settings.maxPage)
              : null;
            that.settings.pageNumberText.innerHTML = generatePageText();
            that.renderTable();
          },
        }),
        that.settings.pageNumberText,
      ],
    });
  }

  buildTableObject(rawData) {
    let that = this;
    let allLines = rawData.split(/\r\n|\n/);
    let dataRows = [];
    let columnNames = [];
    let recordDates = [];

    this.tableData.rowNumber = allLines.length;

    for (let [i, line] of allLines.entries()) {
      let record = {};
      let row = line.split(";");

      let rowNr = i;

      let emptyCell = 0;
      for (let [colNr, col] of row.entries()) {
        if (rowNr === 0) {
          let columnName = noSpecChars(col);
          columnNames.push(columnName);
          that.settings.textFilters[columnName] = null;

          that.tableData.header[columnName] = {
            order: colNr,
            name: col,
          };
          that.tableData.footer[columnName] = {
            order: colNr,
            name: col,
            summary: false,
          };
        } else {
          col.split("").length == 0 ? emptyCell++ : null;
          let cellData = checkCellValue(col);
          record[columnNames[colNr]] = {
            order: colNr,
            row: rowNr - 1,
            cell: cellData.col,
            value: cellData.cellValue,
            type: cellData.type,
          };

          if (cellData.type === "date") {
            recordDates.push(Number(record.datum.value));
          }

          if (colNr === row.length - 1 && emptyCell < row.length) {
            dataRows.push(record);
          }
          for (let columnsToSummarize of that.settings.columnsToSummarize) {
            if (columnsToSummarize === columnNames[colNr]) {
              that.tableData.footer[columnsToSummarize].summary +=
                record[columnNames[colNr]].value;
            }
          }
          this.tableData.allRecordNumber = dataRows.length;
        }
      }
    }

    /* hú bazeg itt is date Filter több lehet....*/
    this.settings.dateFilters.beginDate = Math.min(...recordDates);
    this.settings.dateFilters.firstRecordDate = Math.min(...recordDates);
    this.settings.dateFilters.endDate = Math.max(...recordDates);
    this.settings.dateFilters.LastRecordDate = Math.max(...recordDates);

    that.tableData.body = dataRows;

    function checkCellValue(col) {
      let value;

      value = checkDate(col);
      if (value) {
        return value;
      }

      value = checkTime(col);
      if (value) {
        return value;
      }

      value = checkNumber(col);
      if (value) {
        return value;
      }

      value = checkCurrency(col);
      if (value) {
        return value;
      }

      return { type: "string", col: col, cellValue: null };
    }

    function checkTime(col) {
      let cellValue;
      if (col.includes(":")) {
        cellValue = replaceAll(col, " ", "");
        col = `
            <span
              class="timeStamp"
              data-value="${cellValue}"
              data-type="timeStamp"
            >${cellValue}</span>`;
        return { type: "timeStamp", col: col, cellValue: cellValue };
      }
      return null;
    }

    function checkDate(col) {
      let cellValue;
      let dateLenghtsCheck = [4, 2, 2];
      if (col.includes(".")) {
        cellValue = replaceAll(col, " ", "");
        let checkCellValues = cellValue.split(".");
        if (checkCellValues.length === 3) {
          let checker = 0;
          for (let [i, value] of checkCellValues.entries()) {
            value.length === dateLenghtsCheck[i] ? checker++ : null;
          }
          if ((checker = 3)) {
            let date = checkCellValues.join("");
            let dateUTC = new Date(date);
            col = `<span
            class="recordDate"
            data-year="${checkCellValues[0]}"
            data-month="${checkCellValues[1]}"
            data-day="${checkCellValues[2]}"
            data-type="recordDate"
            data-dateUTC="${dateUTC}"
            >${col}</span>`;
            return { type: "date", col: col, cellValue: date };
          }
        }
      }
      return null;
    }

    function checkNumber(col) {
      let cellValue;
      if (col.includes(",") || col.includes(".")) {
        cellValue = replaceAll(col, " ", "");
        cellValue = Number(col.replace(",", "."));
        if (typeof cellValue === "number" && !isNaN(cellValue)) {
          col = `
            <span
              class="value${isNaN(cellValue) !== "number" ? "-error" : ""}"
              data-value="${cellValue}"
              data-type="${typeof cellValue}"
            >${cellValue}</span>`;
          return {
            type: "number",
            col: col,
            cellValue: cellValue,
          };
        }
      }
      return null;
    }

    function checkCurrency(col) {
      for (let currencyName of that.settings.currencyNames) {
        let cellValue;
        if (col.includes(currencyName)) {
          col = col.replace(currencyName, "");
          col = replaceAll(col, " ", "");
          cellValue = Number(col);
          col = `
            <span
              class="value${typeof cellValue !== "number" ? "-error" : ""}"
              data-currency="${currencyName}"
              data-value="${cellValue}"
              data-type="${typeof cellValue}"
            >${cellValue}</span>
            <span class="currency">${currencyName}</span>`;
          if (typeof cellValue !== "number") {
            cellValue = 0;
          }
          return { type: "currency", col: col, cellValue: cellValue };
        }
      }
      return null;
    }

    function replaceAll(string, search, replace) {
      return string.split(search).join(replace);
    }

    function noSpecChars(text, lowercase = true) {
      for (let char in that.settings.specialChars) {
        text = replaceAll(text, char, that.settings.specialChars[char]);
      }
      return lowercase ? text.toLowerCase() : text;
    }
  }

  renderTableHeader() {
    let headerCells = [];
    let footerCells = [];

    for (let headerCell in this.tableData.header) {
      let cell = this.tableData.header[headerCell];
      let order = cell.order;

      this.settings.columnShow[headerCell] === undefined
        ? (this.settings.columnShow[headerCell] = true)
        : null;

      let classes = this.settings.columnShow[headerCell]
        ? headerCell
        : headerCell + " hide";

      headerCells[order] = Elem.Create({
        tag: "th",
        attributes: {
          id: headerCell,
          class: classes,
        },
        content: this.tableData.header[headerCell].name,
      });

      let footerContent = `${this.tableData.header[headerCell].name}${
        this.tableData.footer[headerCell].summary
          ? ` összesen: ${this.tableData.footer[headerCell].summary}`
          : ``
      }`;

      footerCells[order] = Elem.Create({
        tag: "th",
        attributes: {
          class: classes,
        },
        content: footerContent,
      });
    }

    let header = Elem.Create({
      tag: "thead",
      children: [
        Elem.Create({
          tag: "tr",
          children: headerCells,
        }),
      ],
    });

    let footer = Elem.Create({
      tag: "tfoot",
      children: [
        Elem.Create({
          tag: "tr",
          children: footerCells,
        }),
      ],
    });

    return { footer: header.outerHTML, header: footer.outerHTML };
  }

  setMaxPage() {
    if (this.settings.showRowNumber >= this.tableData.recordNumber) {
      this.settings.maxPage = 0;
      this.settings.page = 0;
    } else {
      this.settings.maxPage = Math.floor(
        this.tableData.recordNumber / this.settings.showRowNumber
      );
    }
    this.settings.page = Math.min(this.settings.maxPage, this.settings.page);
  }

  getFilteredTableProperties(tableRows) {
    this.tableData.recordNumber = tableRows.length;
    this.setMaxPage();
  }

  filtering() {
    let that = this;
    function dateFilterTable(tableRows) {
      for (let filterColumn of that.settings.dateFilterColumns) {
        for (let record of that.tableData.body) {
          if (
            !(
              that.settings.dateFilters.beginDate <=
                Number(record[filterColumn].value) &&
              Number(record.datum.value) <= that.settings.dateFilters.endDate
            )
          ) {
            tableRows.pop(record);
          }
        }
      }
      return tableRows;
    }

    function textfilterTable(tableRows) {
      for (let textFilter in that.settings.textFilters) {
        if (that.settings.textFilters[textFilter] !== null) {
          for (let [index, record] of tableRows.entries()) {
            if (
              that.settings.textFilters[textFilter] === record[textFilter].cell
            ) {
              console.log(
                that.settings.textFilters[textFilter],
                "vs",
                record[textFilter].cell,
                index
              );
              tableRows.splice(index, 1);
              console.log(tableRows.length);
            }
          }
        }
      }
      return tableRows;
    }

    function filterPageTable(tableRows) {
      tableRows = tableRows.slice(
        that.settings.page * that.settings.showRowNumber,
        (that.settings.page + 1) * that.settings.showRowNumber
      );
      return tableRows;
    }

    let filteredTable = this.tableData.body;

    console.log(filteredTable.length);
    filteredTable = dateFilterTable(filteredTable);
    console.log(filteredTable.length);
    filteredTable = textfilterTable(filteredTable);
    console.log(filteredTable.length);

    this.getFilteredTableProperties(filteredTable);

    /* Ennek a táblázat szűrése után kell lennie!!! */
    filteredTable = filterPageTable(filteredTable);
    //console.log(filteredTable.length);

    return filteredTable;
  }

  renderTableBody(filteredTable) {
    let row = [];

    for (let [rowNr, record] of filteredTable.entries()) {
      let rowId;

      let cells = [];

      for (let column in record) {
        let order = record[column].order;
        rowId = record[column].row;

        let classes =
          this.settings.columnShow[column] === true ? column : column + " hide";

        cells[order] = Elem.Create({
          tag: "td",
          content: record[column].cell,
          attributes: {
            class: classes,
          },
          dataset: {
            value: record[column].value !== null ? record[column].value : "",
            type: record[column].type,
          },
        });
      }

      row[rowNr] = Elem.Create({
        tag: "tr",
        attributes: { id: rowId, class: record.datum.value },
        children: cells,
      });
    }

    let body = Elem.Create({
      tag: "tbody",
      children: row,
    });

    return body.outerHTML;
  }

  renderTable() {
    let table = "";

    let headerAndFooter = this.renderTableHeader();

    table += headerAndFooter.header;

    table += this.renderTableBody(this.filtering());

    table += headerAndFooter.footer;

    this.container.appendChild(this.table);
    this.table.innerHTML = table;

    /* hát ez nincs túl jó helyen itt */
    this.renderColumnFilter();
  }
}

let booking = new dataTable({
  containerID: "table-container",
  dataFile: "booking.csv",
  dateFilterColumns: ["datum"],
  columnsToSummarize: ["munkaertek", "mennyiseg"],
});
booking.init();
