// https://www.youtube.com/watch?v=oHg5SJYRHA0
// https://www.youtube.com/watch?v=oHg5SJYRHA0
// https://www.youtube.com/watch?v=oHg5SJYRHA0

/**
 * Convert a model into a column vector with all of its weights
 */
async function modelWeightsToWeightVector(model){
    const flattenedTensors = await Promise.all(model.getWeights().map(async (tensor) => await tensor.flatten().data()));
    return tf.concat(flattenedTensors);
}

/**
 * Generate a random weight vector with dimensions matching our optimal weight vector.
 */
async function randomNormalizedWeightVector(model){
    const normalizedParts = [];

    for(const tensor of model.getWeights()) {
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
 * Generate a loss surface for a {model} on some {data}, centered around our {optimalWeightVector}, using the directions of
 * {randomWeightVectorA} and {randomWeightVectorB}.
 */
async function generateLossSurface(model, data, optimalWeightVector, randomWeightVectorA, randomWeightVectorB, granularity = 10) {
    const stepSize = 1/granularity;

    const losses = [];
    for (const a = -1; a <= 1; a += stepSize) {
        const rowLosses = [];
        losses.append(rowLosses);

        for (const b = -1; b <= 1; b += stepSize) {
            Console.assert(a >= -1 && a <= 1 && b >= -1 && b <= 1);

            const weightVector = optimalWeightVector.add(randomWeightVectorA.mul(a).add(randomWeightVectorB.mul(b)));
            loadModelWeighWeightVector(model, weightVector);

            const loss = evaluateLossOnData(model, data);

            rowLosses.append(loss);
        }
    }
}

/**
 * 
 */
async function evaluateLossOnData(model, data){
    
}

async function test(model) {
    const optimalWeightVector = await modelWeightsToWeightVector(model);
    const normalizedRandomWeightVector = await randomNormalizedWeightVector(model);
    console.log(optimalWeightVector, normalizedRandomWeightVector);

    loadModelWeighWeightVector(model, normalizedRandomWeightVector);
}


const model = tf.sequential({
    layers: [
        tf.layers.dense({ inputShape: [784], units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 10, activation: 'softmax' }),
    ]
});
test(model);