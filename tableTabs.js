// Opens each table in its own tab
// May be blocked by pop-up blockers

let tableTitles = Array.from(document.getElementsByTagName('H3')).filter(h => { return h.id })
let styles = document.querySelector("head > style:nth-child(4)");
for (const tableTitle of tableTitles) {
    const table = tableTitle.nextElementSibling
    let newWindow = window.open()
    newWindow.document.write(`
        <head>
            <title>${tableTitle.id}</title>
            ${styles.outerHTML}
        </head>
    `)
    newWindow.document.write()
    newWindow.document.write(tableTitle.outerHTML)
    newWindow.document.write(table.outerHTML)
}