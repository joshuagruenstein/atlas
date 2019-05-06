export const copyToClipboard = str => {
    const el = document.createElement('textarea');
    el.value = str;

    document.body.appendChild(el);
    el.select();

    document.execCommand('copy');
    document.body.removeChild(el);
};

export const isIncognito = new Promise((resolve, reject) => {
    let fs = window.RequestFileSystem || window.webkitRequestFileSystem;
    if (!fs) reject('Check incognito failed');
    else fs(window.TEMPORARY, 100, ()=>resolve(false), ()=>resolve(true));
});

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

    if (type === 'Vector') {
        if (arr.every(el => el.length === 0)) arr = arr.map(el => el[0]);
        else if (arr.length === 0) throw 'Vector CSVs can only have one column/row.';
    } if (!arr.every((row, i, arr) => row.length === arr[0].length))
        throw 'All rows must be same length';
    if (!arr.every((row, i, arr) => row.every((el, i, row) => !isNaN(el))))
        throw 'All CSV elements must be numeric.';

    arr = arr.map(row => row.map(el => parseFloat(el)));

    if (type === 'Vector') arr = arr[0];

    return arr;
}