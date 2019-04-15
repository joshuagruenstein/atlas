const baseLayout = {
    autosize: false,
    width: 500,
    height: 500,
    margin: {
        l: 0,
        r: 0,
        b: 20,
        t: 90
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

    line(x, y) {
        /**
         * @param x List of x values.
         * @param y List of y values.
         */
        const context = [
            {
                x: x,
                y: y,
                type: 'scatter',
                colorscale: 'YIGnBu'
            }
        ];

        Plotly.newPlot(this.div, context, this.layout);
    }

    surface(data, path) {
        /**
         * @param data 2D array of heights.
         * @param path A list of (x, y) coordinates.
         */
        const context = [];

        if (path) {
            // const scaledPath = path.map(p =>
            //     [((p[0] + 1) * data[0].length) / 2,
            //         ((p[1] + 1) * data.length) / 2]);

            console.log({ path });

            const scaledPath = path.map(p => [
                p[0] * data[0].length,
                p[1] * data.length
            ]);

            const zOffset =
                (Math.max(...data.flat()) - Math.min(...data.flat())) * 0.03;

            context.push({
                type: 'scatter3d',
                mode: 'lines',
                x: scaledPath.map(p => p[0]),
                y: scaledPath.map(p => p[1]),
                z: scaledPath.map(
                    p => this.getHeight(data, p[0], p[1]) + zOffset
                ),
                opacity: 1,
                line: {
                    color: [...Array(scaledPath.length).keys()],
                    colorscale: 'YIOrRd',
                    reversescale: true,
                    width: 6
                }
            });
        }

        context.push({
            z: data,
            type: 'surface',
            colorscale: 'Viridis',
            showscale: false
        });

        Plotly.newPlot(this.div, context, this.layout);
    }

    getHeight(data, xScaled, yScaled) {
        /**
         * @param data 2D array of heights.
         * @param x    x-coordinate of point of interest.
         * @param y    y-coordinate of point of interest.
         */

        const neighborX = Math.floor(xScaled);
        const neighborY = Math.floor(yScaled);

        console.log({ neighborX, neighborY });

        const neighborZ = data[neighborY][neighborX];

        const gradX = data[neighborY][neighborX + 1] - neighborZ;
        const gradY = data[neighborY + 1][neighborX] - neighborZ;

        return (
            neighborZ +
            gradX * (xScaled - neighborX) +
            gradY * (yScaled - neighborY)
        );
    }
}

export default Plot;
