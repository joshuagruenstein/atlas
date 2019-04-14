const baseLayout = {
    autosize: false,
    width: 500,
    height: 500,
    margin: {
        l: 0,
        r: 0,
        b: 0,
        t: 0
    }
};

class Plot {
    constructor(div, title, layout = {}) {
        /**
         * @param div    Location to embed.
         * @param title  Title of the plot.
         * @param layout Specific layout info.
         */
        this.div = div;
        this.layout = baseLayout;
        this.layout['title'] = title;

        for (const prop in layout) {
            this.layout[prop] = layout[prop];
        }
    }

    line = (x, y) => {
        /**
         * @param x List of x values.
         * @param y List of y values.
         */
        const context = [
            {
                x: x,
                y: y,
                type: 'scatter'
            }
        ];

        Plotly.newPlot(this.div, context, this.layout);
    };

    surface = data => {
        /**
         * @param data 2D array of heights.
         */
        const context = [
            {
                z: data,
                type: 'surface'
            }
        ];

        Plotly.newPlot(this.div, context, this.layout);
    };
}

export default Plot;
