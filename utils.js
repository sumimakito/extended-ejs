replaceRange = (input, offset, length, insert) =>
    input.substr(0, offset) + insert + input.substr(offset + length);

calculatePosition = (input, index) => {
    const rows = input.substring(0, index).split('\n');
    if (rows.length === 0) return {row: 0, col: 0};
    return {
        row: rows.length,
        col: rows[rows.length - 1].length,
    };
};

padStart = (input, finalLength) => `${Array.from(Array(finalLength - `${input}`.length + 1)).join(" ")}${input}`;

peekAround = (input, index, lines = 10) => {
    const rows = input.split('\n');
    if (rows.length === 0) return "";
    const {row, col} = calculatePosition(input, index);
    const lineNumberLength = Math.max(`${row}`.length + 1, 4);
    let output = "";
    let rowIndex = row - lines - 1;
    while (rowIndex < 0) rowIndex++;
    while (rowIndex <= row - 1) {
        output += `${padStart(`${rowIndex + 1}`, lineNumberLength)}| ${rows[rowIndex]}\n`;
        rowIndex++;
    }
    output += `${padStart("", lineNumberLength)}  ${padStart(`^`, col)}`;

    return output;
};

panic = (template, index, message) => {
    console.error(`An error occurred while expanding the template${template.file ? ` '${template.file}'` : ''}:\n\n${peekAround(template.raw, index)}\nError: ${message}\n`);
    throw new Error(message);
};

module.exports = {replaceRange, calculatePosition, peekAround, panic};