import UI from "./ui.js";

// https://www.youtube.com/watch?v=oHg5SJYRHA0
// https://www.youtube.com/watch?v=oHg5SJYRHA0
// https://www.youtube.com/watch?v=oHg5SJYRHA0

var running = false;
var cancel = false;

const MAX_LOSS_VALUE = 1000;

/**
 * Accepts a {lossFunction} with {trainableVariables} and generates a loss surface plot
 * for it, according to the {SETTINGS} from the UI.
 */
export async function generateLossSurfaceFromUI(trainableVariables, lossFunction, SETTINGS) {
    if (!SETTINGS) {
        alert("Invalid settings!");
        return;
    }

    const model =
    {
        getWeights: function () {
            return trainableVariables;
        },
        setWeights: function (weights) {
            for (const i in trainableVariables) {
                trainableVariables[i].assign(weights[i]);
            }
        },
        evaluate: function () {
            return lossFunction();
        }
    };

    // TODO: Remove the need for this data and labels
    const data = 1;
    const labels = 1;

    const lossData = await generateLossSurface(
        model,
        data,
        labels,
        SETTINGS["usePCA"],
        SETTINGS["showPath"],
        SETTINGS["granularity"],
        SETTINGS
    );

    await reportLossSurfaceGenerationProgress("All done! :) ", 1);

    if (lossData && lossData.lossSurface) {
        console.log("losses", lossData.losses);
        UI.showLossPlot(lossData.losses);

        if (lossData.lossSurface.every(row => (
            row.every((el, i) => el === lossData.lossSurface[0][i])
        ))){
             UI.setVisualizerPlotLine(
                [...Array(lossData.lossSurface[0].length).keys()],
                lossData.lossSurface[0],
                lossData.pathPositions.map(el => el[0])
            );
        } else if (lossData.lossSurface.every(row => (
            row.every(el => el === row[0])
        ))) {
            UI.setVisualizerPlotLine(
                [...Array(lossData.lossSurface.length).keys()],
                lossData.lossSurface.map(row => row[0]),
                lossData.pathPositions.map(el => el[1])
            );
        } else {
            UI.setVisualizerPlotSurface(
                lossData.lossSurface,
                lossData.pathPositions
            );
        }
    } else {
        UI.setVisualizerStart();
    }
}

/**
 * Generates a loss surface for our {model} on some {data} with {labels}.
 * First trains the model, then generates random vectors, then computes the weight surface.
 */
async function generateLossSurface(model, data, labels, runPCA, showPath, granularity, learningParameters) {
    running = true;

    const trainData = await trainModel(model, data, labels, runPCA, showPath, learningParameters);
    if (!trainData) { // This could happen if trainModel was canceled.
        return;
    }

    const optimalWeightVector = await modelWeightsToWeightVector(model);
    let normalizedA, normalizedB;

    if (optimalWeightVector.shape[0] == 1) {
        normalizedA = tf.tensor([1]);
        normalizedB = tf.tensor([0]);
    } else if (optimalWeightVector.shape[0] == 2){
        normalizedA = tf.tensor([1, 0]);
        normalizedB = tf.tensor([0, 1]);
    } else {
        const weightVectorA = runPCA ? trainData["pca"][0] : await randomNormalizedWeightVector(model);
        const weightVectorB = runPCA ? trainData["pca"][1] : await randomNormalizedWeightVector(model);

        normalizedA = weightVectorA.div(weightVectorA.norm(2));
        normalizedB = weightVectorB.div(weightVectorB.norm(2));
    }     

    const pathPositions = showPath ? await computeWeightTrajectoryPositions(trainData["weightVectors"], optimalWeightVector, normalizedA, normalizedB) : null;

    const lossData = await computeLossSurface(model, data, labels, optimalWeightVector, normalizedA, normalizedB, granularity, pathPositions);
    if (!lossData) { // This could happen if trainModel was canceled.
        return;
    }

    const { lossSurface, percentPathPositions } = lossData;

    await reportLossSurfaceGenerationProgress("Drawing plot ... ", 0, true);

    running = false;
    return { 
        lossSurface, 
        pathPositions: percentPathPositions,
        losses: trainData.losses };
}

/**
 * Report progress.
 */
async function reportLossSurfaceGenerationProgress(message, percent, waitForUIUpdate=false) {
  UI.setVisualizerLoading(percent * 100, message);

  if(waitForUIUpdate) await delay(100); // Delay 1 ms so page has time to re-render
}


/**
 * Convert a model into a column vector with all of its weights
 */
async function modelWeightsToWeightVector(model) {
    const flattenedTensors = await Promise.all(model.getWeights().map(async (tensor) => await tensor.flatten().data()));
    return tf.concat(flattenedTensors);
}

/**
 * Generate a random weight vector with dimensions matching our optimal weight vector.
 */
async function randomNormalizedWeightVector(model) {
    const normalizedParts = [];

    for (const tensor of model.getWeights()) {
        const shape = tensor.shape;
        const flattenedShape = tensor.flatten().shape;

        // Rescale parameters as in section 4 Proposed Visualization: Filter-Wise Normalization of the paper.
        // TODO: This = frobeneus, right?
        // TODO: Scaling separately for each output neuron
        
        if (shape.length == 2) { 
            for (let i = 0; i < shape[1] ; i ++) {
                // Do each output neuron separately
                const tensorPart = tf.slice2d(tensor, [0, i], [shape[0], 1]);
                const randomVector = tf.randomNormal(tensorPart.flatten().shape); // Flatten to turn it into a 1D rather than 2D
                
                const scaling = (await tf.norm(tensorPart, 'euclidean').div(tf.norm(randomVector, 'euclidean')).data())[0];
                normalizedParts.push(randomVector.mul(scaling));
            }
        } else {
            // TODO: Should we be normalizing these biases?
            const randomVector = tf.randomNormal(flattenedShape);

            const scaling = (await tf.norm(tensor, 'euclidean').div(tf.norm(randomVector, 'euclidean')).data())[0];
            normalizedParts.push(randomVector.mul(scaling));
        }

        // normalizedParts.push(randomVector);
    }

    return tf.concat(normalizedParts);
}

/**
 * Take a weight vector corresponding to a model's weights, convert from the vector to the right weight sizes, and load into the model.
 */
async function loadModelWeighWeightVector(model, weightVector) {
    const reconstructedWeights = [];

    let runningHeight = 0;
    for (const tensor of model.getWeights()) {
        const height = tensor.flatten().shape[0];

        const weightVectorPart = weightVector.slice(runningHeight, height);
        reconstructedWeights.push(weightVectorPart.reshapeAs(tensor));

        runningHeight += height;
    }

    model.setWeights(reconstructedWeights);
}

/**
 * Compute a loss surface for a {model} on some {data}, centered around our {optimalWeightVector}, using the directions of
 * {randomWeightVectorA} and {randomWeightVectorB}.
 */
async function computeLossSurface(model, data, labels, optimalWeightVector, randomWeightVectorA, randomWeightVectorB, granularity = 10, pathPositions = null) {
    let evalIndex = 0;
    let aMax, aMin, bMax, bMin;

    // // Stretching
    const lossSurfaceDimensions = "square_around_optimum";

    switch (lossSurfaceDimensions) {
        case "square_around_optimum":
            const SQUARE_SIZE = 1;0 // TODO: This is arbitrary
            aMin = Math.min(-SQUARE_SIZE, Math.min(...pathPositions.map(x => x[0])));
            aMax = Math.max(SQUARE_SIZE, Math.max(...pathPositions.map(x => x[0])));
            bMin = Math.min(-SQUARE_SIZE, Math.min(...pathPositions.map(x => x[1])));
            bMax = Math.max(SQUARE_SIZE, Math.max(...pathPositions.map(x => x[1])));
            break;
        
        case "fit_to_trajectory":
            //Fit exactly to points
            aMax = Math.max(...pathPositions.map(p => p[0]));
            bMin = Math.min(...pathPositions.map(p => p[1]));
            aMin = Math.min(...pathPositions.map(p => p[0]));
            bMax = Math.max(...pathPositions.map(p => p[1]));

            break;

        case "square_around_optimum_scaled_to_trajectory":
            //Fit exactly to points
            aMax = Math.max(...pathPositions.map(p => p[0]));
            bMin = Math.min(...pathPositions.map(p => p[1]));
            aMin = Math.min(...pathPositions.map(p => p[0]));
            bMax = Math.max(...pathPositions.map(p => p[1]));

            // Turn the dimensions into a square centered around optimum
            const maxStretch = Math.max(Math.abs(aMin), Math.abs(bMin), Math.abs(aMax), Math.abs(bMax));
            aMin = -maxStretch;
            bMin = -maxStretch;
            aMax = maxStretch;
            bMax = maxStretch;

            break;

        case "fit_to_trajectory_square":
            //Fit exactly to points
            aMax = Math.max(...pathPositions.map(p => p[0]));
            bMin = Math.min(...pathPositions.map(p => p[1]));
            aMin = Math.min(...pathPositions.map(p => p[0]));
            bMax = Math.max(...pathPositions.map(p => p[1]));

            // Turn the dimensions into a square
            const aDiff = aMax - aMin;
            const bDiff = bMax - bMin;
            if (aDiff > bDiff) {
                const extraBPadding = (aDiff - bDiff) / 2;
                bMin -= extraBPadding;
                bMax += extraBPadding;
            } else {
                const extraAPadding = (bDiff - aDiff) / 2;
                aMin -= extraAPadding;
                aMax += extraAPadding;
            }
            break;
        
        default:
            alert("Invalid loss surface dimensions");
    }

    // Add padding around our region to make sure we're not too close to our trajectory
    const aStepSize = (aMax - aMin) / granularity;
    const bStepSize = (bMax - bMin) / granularity;

    aMin -= aStepSize;
    aMax += aStepSize * 2;

    bMin -= bStepSize;
    bMax += bStepSize * 2;

    const lossSurface = [];

    console.log( {bMin, bMax, aMin, aMax});

    for (let b = bMin; b < bMax; b += bStepSize) {
        const rowLosses = [];
        lossSurface.push(rowLosses);

        for (let a = aMin; a < aMax; a += aStepSize) {
            // console.assert(a >= -1 && a <= 1 && b >= -1 && b <= 1);

            await reportLossSurfaceGenerationProgress("Generating Loss Surface", evalIndex / (((aMax - aMin) / aStepSize) * (bMax - bMin) / bStepSize));

            const weightVector = optimalWeightVector.add(randomWeightVectorA.mul(a).add(randomWeightVectorB.mul(b)));
            loadModelWeighWeightVector(model, weightVector);

            const loss = await evaluateLossOnData(model, data, labels);

            rowLosses.push(loss);
            evalIndex += 1;

            if (cancel) {
                cancelSucceeded();
                return;
            }
        }
    }
    console.log({lossSurface});

    // Compute path positions as percents along the a and b axes
    const percentPathPositions = pathPositions.map(p => 
        [(p[0] - aMin) / (aMax - aMin),
         (p[1] - bMin) / (bMax - bMin)]);

    return { lossSurface, percentPathPositions };
}

/**
 * Evaluate the model's loss.
 */
async function evaluateLossOnData(model, data, labels) {
    const modelOutput = model.evaluate().flatten();
    console.assert(modelOutput.shape == 1, "The output of the model must by 1, not " + modelOutput.shape);
    // console.log(modelOutput);
    // const t = model.evaluate(data, labels)[0];
    // return (await t.data())[0];
    const loss = (await modelOutput.data())[0];
    // console.log(await Promise.all(model.getWeights().map(w => w.data())), loss);
    return loss;
}

/**
 * Get an optimizer from the {learningParameters}.
 */
function getOptimizer(learningParameters){
    switch (learningParameters["optimizer"].toLowerCase()) {
        case "sgd":
            return tf.train.sgd(learningParameters["learningRate"]);
        case "momentum":
            return tf.train.momentum(learningParameters["learningRate"], learningParameters["momentum"]);
        case "adagrad":
            return tf.train.adagrad(learningParameters["learningRate"]);
        case "adadelta":
            return tf.train.adadelta(learningParameters["learningRate"]);
        case "adam":
            return tf.train.adam(learningParameters["learningRate"]);
        case "rmsprop":
            return tf.train.rmsprop(learningParameters["learningRate"]);
        default:
            alert("Invalid optimizer! " + learningParameters["optimizer"]);
    }
}

/**
 * Train the model.
 */
async function trainModel(model, data, labels, runPCA = false, showPath = false, learningParameters) {
    const weightVectors = [];
    const losses = [];

    const optimizer = getOptimizer(learningParameters);

    for (let epoch = 0; epoch < learningParameters["epochs"]; epoch += 1) {
        const loss = (await optimizer.minimize(model.evaluate, true, model.getWeights()).data())[0];

        losses.push(loss);

        await reportLossSurfaceGenerationProgress("Training model", epoch / learningParameters["epochs"]);
        if (runPCA || showPath) {
            weightVectors.push(await modelWeightsToWeightVector(model));
        }

        // TODO:
        if (loss < -MAX_LOSS_VALUE) {
            UI.renderError("[Training Alert] Your loss value exceeded " + -MAX_LOSS_VALUE + " so we prematurely stopped your training process.");
            break;
        }

        if (loss > MAX_LOSS_VALUE) {
            UI.renderError("[Training Alert] Your loss value exceeded " + MAX_LOSS_VALUE + " so we prematurely stopped your training process.");
            break;
        }

        if (cancel) {
            cancelSucceeded();
            return;
        }
    }

    if (runPCA) {
        await reportLossSurfaceGenerationProgress("Running PCA (this page may freeze)", 0, true);

        const weightVectorsOnCPU = await Promise.all(weightVectors.map(w => w.data()));

        const pca = new PCA.getEigenVectors(weightVectorsOnCPU);

        const vectorA = tf.tensor(pca[0].vector);
        const vectorB = tf.tensor(pca[1].vector);
        await reportLossSurfaceGenerationProgress("Running PCA", 1);

        return {
            "pca": [vectorA, vectorB],
            "weightVectors": weightVectors,
            "losses": losses
        };
    }else {
        return {
          "weightVectors": weightVectors,
          "losses": losses
        };
    }
}

/**
 * Project each of the weight vectors onto 2D coordinates.
 */
async function computeWeightTrajectoryPositions(weightVectors, optimalWeightVector, normalizedA, normalizedB) {
    return await Promise.all(weightVectors.map(async weightVector => {
        const diff = weightVector.sub(optimalWeightVector);
        return [
            (await diff.dot(normalizedA).data())[0],
            (await diff.dot(normalizedB).data())[0]
        ];
    }));
}

/**
 * Tester.
 */
async function test() {
    const SETTINGS = UI.getSettings();
    if (!SETTINGS) {
        alert("Invalid settings!");
        return;
    }

    const xs = tf.tensor2d([[0, 1, 2, 3]]).transpose();
    const A = tf.variable(tf.randomNormal([1, 4]));

    // const a = tf.scalar(Math.random()).variable();
    // const b = tf.scalar(Math.random()).variable();
    // const c = tf.scalar(Math.random()).variable();

    // y = a * x^2 + b * x + c.
    // const f = () => 
    // const f = x => a.mul(x.square()).add(b.mul(x)).add(c);
    // const loss = (pred, label) => pred.sub(label).square().mean();

    const model =
    {
        getWeights: function () {
            return [A];
        },
        setWeights: function(weights) {
            const variables = [A];
            for(const i in variables) {                
                variables[i].assign(weights[i]);
            }
        },
        evaluate: function () {
            return tf.norm(tf.sin(A.matMul(xs))).sum();
        }
    };
    const data = 1;
    const labels = 1;

    // const data = tf.randomNormal([100, 78]);
    // const labels = tf.randomUniform([100, 10]);

    const lossData = await generateLossSurface(
      model,
      data,
      labels,
      SETTINGS["usePCA"],
      SETTINGS["showPath"],
      SETTINGS["granularity"],
      SETTINGS
    );
    
    await reportLossSurfaceGenerationProgress("All done! :) ", 1);

    if (lossData && lossData.lossSurface) {
        UI.setVisualizerPlotSurface(lossData.lossSurface, lossData.pathPositions);
    } else {
        UI.setVisualizerStart();
    }
}

/**
 * Delay helper
 */
function delay(t, v) {
    return new Promise(function (resolve) {
        setTimeout(resolve.bind(null, v), t)
    });
}

/**
 * Hacky cancel mechanism.
 */
function cancelExecution(){
    cancel = true;
}

function cancelSucceeded(){
    cancel = false;
    running = false;
}

UI.setVisualizerStartHandler(() => {
    test();
});


UI.setVisualizerCancelHandler(() => {
    if (running) cancelExecution();
    else UI.setVisualizerStart();
});
