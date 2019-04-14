import UI from './ui.js';

UI.setOnloadHandler(() => {
    UI.renderSuccess("hi");
});

UI.setVisualizerStartHandler(() => {
    UI.setVisualizerPlotSurface([
        [1,2,3,4,5],
        [1,2,3,4,5]
    ]);
});

UI.setVisualizerCancelHandler(() => {
    UI.setVisualizerStart();
})
