export const parseCSV = (str, type) => {
    let arr = [];

    for (let row = 0, col = 0, c = 0; c < str.length; c++) {
        let cc = str[c],
            nc = str[c + 1];
        arr[row] = arr[row] || [];
        arr[row][col] = arr[row][col] || '';

        if (cc == '"')
            throw 'No quotes allowed in CSV files.';
        if (cc == ',') {
            ++col;
            continue;
        }

        if (cc == '\r' && nc == '\n') {
            ++row;
            col = 0;
            ++c;
            continue;
        }

        if (cc == '\n') {
            ++row;
            col = 0;
            continue;
        }
        if (cc == '\r') {
            ++row;
            col = 0;
            continue;
        }

        arr[row][col] += cc;
    }

    if (type === 'Vector' && arr.length > 1)
        throw 'Vector CSVs can only have one row.';
    if (!arr.every((row, i, arr) => row.length === arr[0].length))
        throw 'All rows must be same length';
    if (!arr.every((row, i, arr) => row.every((el, i, row) => !isNaN(el))))
        throw 'All CSV elements must be numeric.';

    arr = arr.map(row => row.map(el => parseFloat(el)));

    if (type === 'Vector') arr = arr[0];

    return arr;
}