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
    //this.renderColumnFilter();
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
        classes: "filterText",
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
        classes: "dateFilterContainer",
        id: "dateFilterContainer",
      },
      targetParent: this.tableController,
      children: [
        Elem.Create({
          tag: "div",
          attributes: {
            classes: "dateFilter-input",
          },
          children: [
            Elem.Create({
              tag: "label",
              content: "Kezdő dátum: ",
              attributes: {
                classes: "beginDate-label",
                id: "beginDate-label",
              },
            }),
            Elem.Create({
              tag: "input",
              attributes: {
                type: "date",
                classes: "beginDate",
                id: "beginDate",
              },
              eventStarter: "change",
              eventFunction: function (e) {
                e.preventDefault();
                let newBegintDate = Number(this.value.split("-").join(""));

                that.settings.dateFilters.beginDate =
                  newBegintDate < that.settings.dateFilters.firstRecordDate
                    ? that.settings.dateFilters.firstRecordDate
                    : newBegintDate;

                that.settings.dateFilters.filterText.innerHTML = generateFilterText();
                that.renderTable();
              },
            }),
          ],
        }),
        Elem.Create({
          tag: "div",
          attributes: {
            classes: "dateFilter-input",
          },
          children: [
            Elem.Create({
              tag: "label",
              content: "Befejező dátum: ",
              attributes: {
                classes: "endDate-label",
                id: "endDate-label",
              },
            }),
            Elem.Create({
              tag: "input",
              attributes: {
                type: "date",
                classes: "endDate",
                id: "endDate",
              },
              eventStarter: "change",
              eventFunction: function (e) {
                e.preventDefault();
                let newEndDate = Number(this.value.split("-").join(""));

                that.settings.dateFilters.endDate =
                  newEndDate > that.settings.dateFilters.LastRecordDate
                    ? that.settings.dateFilters.LastRecordDate
                    : newEndDate;

                that.settings.dateFilters.filterText.innerHTML = generateFilterText();
                that.renderTable();
              },
            }),
          ],
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
        Elem.Create({
          tag: "div",
          attributes: { class: "columnCheckbox" },
          children: [
            Elem.Create({
              tag: "input",
              content: this.tableData.header[column].name,
              attributes: {
                id: `${column}-checkbox`,
                type: "checkbox",
                checked: that.settings.columnShow[column],
              },
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
            }),
            Elem.Create({
              tag: "label",
              content: this.tableData.header[column].name,
              attributes: { for: `${column}-checkbox` },
            }),
          ],
        })
      );
    }

    Elem.Create({
      tag: "div",
      attributes: {
        classes: "checkBoxesContainer",
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
        Elem.Create({
          tag: "label",
          attributes: { class: "rowControlLabel" },
          content: "Sorok száma: ",
        }),
        Elem.Create({
          tag: "select",
          attributes: { id: "rowNumberSelect" },
          children: generateOptionText(),
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
    let header = "";
    header += `<thead>`;

    let headerCells = [];
    for (let headerCell in this.tableData.header) {
      let cell = this.tableData.header[headerCell];
      let order = cell.order;

      this.settings.columnShow[headerCell] === undefined
        ? (this.settings.columnShow[headerCell] = true)
        : null;

      headerCells[order] = `<th id="${headerCell}" class="${headerCell}${
        this.settings.columnShow[headerCell] ? "" : " hide"
      }">${this.tableData.header[headerCell].name}</th>`;
    }
    header += `<tr>${headerCells.join("")}</tr>`;

    header += `</thead>`;
    return header;
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

  dateFilterTable(tableRows) {
    for (let filterColumn of this.settings.dateFilterColumns) {
      for (let record of this.tableData.body) {
        if (
          !(
            this.settings.dateFilters.beginDate <=
              Number(record[filterColumn].value) &&
            Number(record.datum.value) <= this.settings.dateFilters.endDate
          )
        ) {
          tableRows.pop(record);
        }
      }
    }
    return tableRows;
  }

  textfilterTable(tableRows) {
    for (let textFilter in this.settings.textFilters) {
      if (this.settings.textFilters[textFilter]) {
        console.log(textFilter, this.settings.textFilters[textFilter]);
        for (let record of tableRows) {
          if (
            this.settings.textFilters[textFilter] !== record[textFilter].cell
          ) {
            tableRows.pop(record);
            console.log(this.settings.textFilters[textFilter]);
          }
        }
      }
    }
    return tableRows;
  }

  filterPageTable(tableRows) {
    tableRows = tableRows.slice(
      this.settings.page * this.settings.showRowNumber,
      (this.settings.page + 1) * this.settings.showRowNumber
    );
    return tableRows;
  }

  getFilteredTableProperties(tableRows) {
    console.log(tableRows.length);
    this.tableData.recordNumber = tableRows.length;
    this.setMaxPage();
  }

  /* must refactoring */
  renderTableBody() {
    let body = "";
    let row = [];

    body += `<tbody>`;

    let filteredTable = this.tableData.body;

    filteredTable = this.dateFilterTable(filteredTable);
    filteredTable = this.textfilterTable(filteredTable);

    this.getFilteredTableProperties(filteredTable);

    filteredTable = this.filterPageTable(filteredTable);

    for (let [rowNr, record] of filteredTable.entries()) {
      let rowId;

      let cells = [];

      for (let column in record) {
        let order = record[column].order;
        let value = record[column].value;
        let type = record[column].type;
        let cell = record[column].cell;
        rowId = record[column].row;

        cells[order] = `<td
            class="${column}${this.settings.columnShow[column] ? "" : " hide"}"
            ${value !== null ? `data-value="${value}"` : ``}
            data-type="${type}">${cell}</td>`;
      }

      row[rowNr] = `<tr
          id="${rowId}"
          class="${record.datum.value}">${cells.join("")}</tr>`;
    }

    body += row.join("");

    body += `</tbody>`;
    return body;
  }

  /* must refactoring */
  renderTableFooter() {
    let footer = "";
    footer += `<tfoot>`;
    let footerCells = [];
    for (let footerCell in this.tableData.header) {
      let cell = this.tableData.footer[footerCell];
      let order = cell.order;
      let summary = this.tableData.footer[footerCell].summary;

      footerCells[order] = `<td class="${footerCell}
      ${this.settings.columnShow[footerCell] ? "" : " hide"}
      ">${this.tableData.header[footerCell].name}${
        summary ? ` összesen: ${summary}` : ``
      }</td>`;
    }
    footer += `<tr>${footerCells.join("")}</tr>`;
    footer += `</tfoot>`;
    return footer;
  }

  /* must refactoring */
  renderTable() {
    let table = "";

    table += this.renderTableHeader();
    table += this.renderTableBody();
    table += this.renderTableFooter();

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
  columnsToSummarize: [("munkaertek", "mennyiseg")],
});
booking.init();
