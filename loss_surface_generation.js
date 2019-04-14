// https://www.youtube.com/watch?v=oHg5SJYRHA0
// https://www.youtube.com/watch?v=oHg5SJYRHA0
// https://www.youtube.com/watch?v=oHg5SJYRHA0

/**
 * Generates a loss surface for our {model} on some {data} with {labels}.
 * First trains the model, then generates random vectors, then computes the weight surface.
 */
async function generateLossSurface(model, data, labels, granularity = 10) {
    await trainModel(model, data, labels);

    const optimalWeightVector = await modelWeightsToWeightVector(model);
    const normalizedRandomWeightVectorA = await randomNormalizedWeightVector(model);
    const normalizedRandomWeightVectorB = await randomNormalizedWeightVector(model);

    const lossSurface = await computeLossSurface(model, data, labels, optimalWeightVector, normalizedRandomWeightVectorA, normalizedRandomWeightVectorB, granularity);

    return lossSurface;
}

/**
 * Report progress.
 */
async function reportLossSurfaceGenerationProgress(message, percent) {
  console.log("reportLossSurfaceGenerationProgress", message, percent);
  await delay(1); // Delay 1 ms so page has time to re-render
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
        const shape = tensor.flatten().shape;

        const randomVector = tf.randomNormal(shape);

        // Rescale parameters as in section 4 Proposed Visualization: Filter-Wise Normalization of the paper.
        // TODO: Why didn't 'fro' work?
        const scaling = (await tf.norm(tensor, 'euclidean').div(tf.norm(randomVector, 'euclidean')).data())[0];

        normalizedParts.push(randomVector.mul(scaling));
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
async function computeLossSurface(model, data, labels, optimalWeightVector, randomWeightVectorA, randomWeightVectorB, granularity = 10) {
    const stepSize = 1 / granularity;

    let evalIndex = 0;

    const losses = [];
    for (let a = -1; a <= 1; a += stepSize) {
        const rowLosses = [];
        losses.push(rowLosses);

        for (let b = -1; b <= 1; b += stepSize) {
            console.assert(a >= -1 && a <= 1 && b >= -1 && b <= 1);

            await reportLossSurfaceGenerationProgress("Generating Loss Surface", evalIndex / Math.pow((granularity * 2 + 1), 2));

            const weightVector = optimalWeightVector.add(randomWeightVectorA.mul(a).add(randomWeightVectorB.mul(b)));
            loadModelWeighWeightVector(model, weightVector);

            const loss = await evaluateLossOnData(model, data, labels);

            rowLosses.push(loss);
            evalIndex += 1;
        }
    }

    return losses;
}

/**
 * Evaluate the model's loss.
 */
async function evaluateLossOnData(model, data, labels) {
    const t = model.evaluate(data, labels)[0];
    return (await t.data())[0];
}

/**
 * Train the model.
 */
async function trainModel(model, data, labels, epochs = 5, runPCA = true) {
    console.log("train model");

    const weightVectors = [];

    const onBatchEnd = (batch, logs) => {
        // TODO: Wire this up to UI
        console.log('Accuracy', logs.acc);
    };

    const onEpochEnd = async (epoch) => {
        await reportLossSurfaceGenerationProgress("Training model", epoch / epochs);
        if (runPCA) {
            weightVectors.push(await (await modelWeightsToWeightVector(model)).data());
        }
    }

    await model.fit(data, labels, {
        epochs,
        batchSize: 32,
        callbacks: { onBatchEnd, onEpochEnd }
    });

    if (runPCA) {
        await reportLossSurfaceGenerationProgress("Running PCA (this may take a while)", 0);

        const pca = new PCA.getEigenVectors(weightVectors);

        const vectorA = pca[0].vector;
        const vectorB = pca[1].vector;
        await reportLossSurfaceGenerationProgress("Running PCA", 1);

        return [vectorA, vectorB];
    }else {
        // Return nothing
    }
}

/**
 * Tester.
 */
function test() {
    const model = tf.sequential({
        layers: [
            //784
            tf.layers.dense({ inputShape: [78], units: 10, activation: 'relu' }),
            tf.layers.dense({ units: 10, activation: 'softmax' }),
        ]
    });
    model.compile({
        optimizer: 'sgd',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });
    const data = tf.randomNormal([100, 78]);
    const labels = tf.randomUniform([100, 10]);

    generateLossSurface(model, data, labels);
}

/**
 * Delay helper
 */
function delay(t, v) {
    return new Promise(function (resolve) {
        setTimeout(resolve.bind(null, v), t)
    });
}

test();
