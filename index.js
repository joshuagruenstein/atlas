import UI from "./ui.js";
import loss_surface_generation from "./loss_surface_generation.js";

UI.setOnloadHandler(() => {
    UI.renderSuccess('hi');
});

UI.setVisualizerStartHandler(() => {
    UI.setVisualizerPlotSurface([[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]]);
});

UI.setVisualizerCancelHandler(() => {
    UI.setVisualizerStart();
});
