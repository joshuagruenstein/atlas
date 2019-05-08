const baseLayout = {
    autosize: false,
    width: 500,
    height: 500,
    margin: {
        l: 0,
        r: 0,
        b: 20,
        t: 90
    },
    scene: {
        aspectratio: { x: 1, y: 1, z: 0.7 },
        aspectmode: 'manual',
        xaxis: {
            showticklabels: false,
            title: {
                text: ''
            }
        },
        yaxis: {
            showticklabels: false,
            title: {
                text: ''
            }
        },
        zaxis: {
            title: {
                text: 'Cost'
            }
        },
        camera: {
            eye: {x: 0, y: 0}
        }
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

    line(x, y, path) {
        /**
         * @param x List of x values.
         * @param y List of y values.
         * @param path A list of x coordinates.
         */

        const context = [
            {
                x: x,
                y: y,
                type: 'scatter',
                colorscale: 'YIGnBu'
            }
        ];

        if (path) {
            const scaledPath = path.map(p => p * y.length);

            context.push({
                type: 'scatter',
                mode: 'lines+markers',
                x: scaledPath,
                y: scaledPath.map(p => this.getHeight2D(y, p)),
                opacity: 1
            });
        }

        Plotly.newPlot(this.div, context, this.layout);
    }

    surface(data, path) {
        /**
         * @param data 2D array of heights.
         * @param path A list of (x, y) coordinates.
         */
        const context = [];
        const frames = [];
        if (path) {
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

            if (scaledPath.length > 20) {
                for (let i = 0; i < 20; i++) {
                    const tempPath = scaledPath.slice(0, scaledPath.length / 19 * i);
                    frames.push({
                        data: [
                            {
                                x: tempPath.map(p => p[0]),
                                y: tempPath.map(p => p[1]),
                                z: tempPath.map(
                                    p =>
                                        this.getHeight(data, p[0], p[1]) +
                                        zOffset
                                )
                            },
                            {}
                        ]
                    });
                }
            }
        }

        context.push({
            z: data,
            type: 'surface',
            colorscale: 'Viridis',
            showscale: false,
            contours: {
                z: {
                  show:true,
                  usecolormap: true,
                  highlightcolor:"#42f462",
                  project:{z: true}
                }
              }
        });

        const obj = {
            data: context,
            frames: frames,
            layout: this.layout
        };

        Plotly.newPlot(this.div, obj);

        if (path) {
            Plotly.animate(this.div, null, {
                frame: { duration: 0, redraw: false },
                transition: {
                    duration: 0
                }
            });
        }
    }

    getHeight(data, xScaled, yScaled) {
        /**
         * @param data 2D array of heights.
         * @param x    x-coordinate of point of interest.
         * @param y    y-coordinate of point of interest.
         */

        const neighborX = Math.floor(xScaled);
        const neighborY = Math.floor(yScaled);

        const neighborZ = data[neighborY][neighborX];

        const gradX = data[neighborY][neighborX + 1] - neighborZ;
        const gradY = data[neighborY + 1][neighborX] - neighborZ;

        return (
            neighborZ +
            gradX * (xScaled - neighborX) +
            gradY * (yScaled - neighborY)
        );
    }

    getHeight2D(data, xScaled) {
        /**
         * @param data 2D array of heights.
         * @param x    x-coordinate of point of interest.
         * @param y    y-coordinate of point of interest.
         */

        const neighborX = Math.floor(xScaled);
        const neighborZ = data[neighborX];

        const grad = data[neighborX + 1] - neighborZ;

        return neighborZ + grad * (xScaled - neighborX);
    }
}

export default Plot;
