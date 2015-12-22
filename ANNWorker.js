var networkInitialized = false;
var trainingSet = [];
var predictSet = [];

var hiddenLayerCount = null;
var learningRate     = 0;
var tolerance        = 0;
var layers   = [];
var OUTPUT_LAYER_INDEX = -1;
var INPUT_LAYER_INDEX  =  0;
var totalNodeCount = 0;

var currentEpoch = 0;
var currentExample = 0;
var currentNode  = 0;
var currentLayer = 1;
var currentMode  = '';

var maxEpoch = -1;
var maxExamples = -1;
var networkStepper = null;

function generateNodeName(layerId, nodeId) {
    if(layerId == 0) {
        return "I," + nodeId;
    }else if(layerId == OUTPUT_LAYER_INDEX) {
        return "O," + nodeId;
    } else {
        return layerId + "," + nodeId;
    }
}
function getInputs(id) {
    return trainingSet[id][0];
}

function getOutputs(id) {
    return trainingSet[id][1];
}

var lastUsedWeight = -1;
function debugWeight() {
    lastUsedWeight++;
    var weights = [0.1, 0.4, 0.8, 0.6, 0.3, 0.9];
    return weights[lastUsedWeight];
}

function randomWeight() {
    return Math.random() - 0.5;
}

function output(v) {
    return (1 / (1 + Math.pow(Math.E, -v)));
}
    
function outputDerivative(v) {
    return v * (1 - v);
}

function emitPredictionEvent(outset) {
    self.postMessage({
        'event'  : 'prediction_done',
        'output' : outset,          
        'network': layers
    });
}
function emitEvent(eventId, layerId, nodeId) {
    self.postMessage({
        'event'           : eventId,
        'currentLayerId'  : layerId,
        'currentNode'     : nodeId,
        'network'         : layers
    });
}

function feedForwardNode(layerId, nodeId) {
    
    var node = layers[layerId][nodeId];
    var isOutputLayer = (layerId == OUTPUT_LAYER_INDEX);
    
    node.input = (node.thres?node.thres:0);
    //node.input = 0;
    for(var j=0;j<node.inConn.length;j++) {
        node.input += node.inConn[j].weight * node.inConn[j].from.output;
    }
    node.output = output(node.input);
    //console.log("Input to " + node.name + " " + node.input + " -> " + node.output);
    
    //node.target === false when we are predicting
    if(isOutputLayer && node.target !== false) {
        node.hitTarget = true;
        var lowBound = (node.target - tolerance);
        var upBound  = (node.target + tolerance); 
        if(node.output > upBound || node.output < lowBound) {
            node.hitTarget = false;
        }
        /*
        console.log(
            trainingSet[currentExample][0][0], 
            trainingSet[currentExample][0][1], 
            node.output,
            node.target
        );
        */
    }
    return node.output;
}

function backPropagateNode(layerId, nodeId) { 
    
    var node = layers[layerId][nodeId];
    node.error = outputDerivative(node.output);
    var cumError = 0;
    if(layerId == OUTPUT_LAYER_INDEX) {
        cumError = node.target - node.output;
    } else {
        for(var j=0;j<node.outConn.length;j++) {
            cumError += node.outConn[j].to.error * node.outConn[j].weight;
        }
    }
    node.error *= cumError;

    //console.log("Error At " + node.name + " = " + node.error);
    for(var j=0;j<node.inConn.length;j++) {
        //console.log(layerId, nodeId);
        var conn = node.inConn[j];
        var prev = conn.weight;
        node.inConn[j].weight = conn.weight + (learningRate * node.error * conn.from.output);
        //console.log("FROM " + conn.from.name + " TO " + conn.to.name + " -> " + prev + " | " + conn.weight);
        /*
        if(layerId == 1 && nodeId == 1) {
            if(prev == node.inConn[j].weight){
                console.log(conn.from.output);
            }
        }
        */
    }
    if(node.thres) {
        node.thres = node.thres + (learningRate * node.error * 1.0);
        //console.log(node.thres);
    }
    return node;
}

function initInputNodes(inputs) {
    for(var i=0;i<inputs.length;i++) {
        layers[0][i].output = inputs[i];
    }
}

function initMarginNodes(exampleId) {
    initInputNodes(getInputs(exampleId));
    var outputs= getOutputs(exampleId);
    for(var i=0;i<outputs.length;i++) {
        layers[OUTPUT_LAYER_INDEX][i].target = outputs[i];
    }
}

function* predict() {
    
    initInputNodes(predictSet[0]);
    
    //Feedforward
    for(currentLayer=1;currentLayer<layers.length;currentLayer++) {
        for(currentNode=0;currentNode<layers[currentLayer].length;currentNode++) {
            feedForwardNode(currentLayer, currentNode);
            emitEvent('node_ff_done', currentLayer, currentNode);
            if(currentMode == 'node') {
                emitEvent('simultaion_paused');
                yield 1;
            }
        }
        emitEvent('layer_ff_done', currentLayer, currentNode);
        if(currentMode == 'layer') {
            emitEvent('simultaion_paused');
            yield 2;
        }
    }
    
    var outset = [];
    for(var i=0;i<layers[OUTPUT_LAYER_INDEX].length;i++) {
        outset.push(layers[OUTPUT_LAYER_INDEX][i].output);
    }
    emitPredictionEvent(outset);
    return null;
}

function* train() {
    
    for(currentEpoch=0;currentEpoch<maxEpochs;currentEpoch++) {

        var allExamplesCorrect = true;
        for(currentExample=0;currentExample<maxExamples;currentExample++) {
            
            var allOutputsCorrect = true;
            initMarginNodes(currentExample);
            //Feedforward
            for(currentLayer=1;currentLayer<layers.length;currentLayer++) {
                for(currentNode=0;currentNode<layers[currentLayer].length;currentNode++) {
                    feedForwardNode(currentLayer, currentNode);
                    if(currentLayer == OUTPUT_LAYER_INDEX) {
                        allOutputsCorrect = allOutputsCorrect && layers[currentLayer][currentNode].hitTarget;
                        //console.log(allTargetsHit);
                    }
                    emitEvent('node_ff_done', currentLayer, currentNode);
                    if(currentMode == 'node') {
                        emitEvent('simultaion_paused');
                        yield 1;
                    }
                }
                emitEvent('layer_ff_done', currentLayer, currentNode);
                if(currentMode == 'layer') {
                    emitEvent('simultaion_paused');
                    yield 2;
                }
            }
            
            
            //Backpropagate
            if(!allOutputsCorrect) {
                for(currentLayer=layers.length - 1;currentLayer>=1;currentLayer--) {
                    for(currentNode=layers[currentLayer].length - 1;currentNode>=0;currentNode--) {
                        backPropagateNode(currentLayer, currentNode);
                        emitEvent('node_bp_done', currentLayer, currentNode);
                        if(currentMode == 'node'){
                            emitEvent('simultaion_paused');
                            yield 3;
                        }
                    }
                    emitEvent('layer_bp_done', currentLayer, currentNode);
                    if(currentMode == 'layer') {
                        emitEvent('simultaion_paused');
                        yield 4;
                    }
                }
            }
           
            emitEvent('example_done');
            if(currentMode == 'example') {
                emitEvent('simultaion_paused');
                yield 5;
            }
            
            allExamplesCorrect = allExamplesCorrect && allOutputsCorrect;
        }
        
        
        emitEvent('epoch_done');
        if(currentMode == 'epoch') {
            emitEvent('simultaion_paused');
            yield 6;
        }
        
        if(allExamplesCorrect) {
            break;
        } 
    }
    
    emitEvent('training_done');
    return null;
}





function createNetwork(params) {
    
    trainingSet = params.trainingDataset;
    hiddenLayerCount = params.hiddenLayerCount;
    maxEpochs = params.epochs;
    maxExamples = trainingSet.length;
    
    learningRate = params.learningRate;
    tolerance = params.tolerance;
 
     
    var nodeIndexCounter = 0;
    var counter = -1;
    var inputNodeCount = getInputs(0).length;
    var outputNodeCount= getOutputs(0).length;
    layers.push([]);
    for(var i=0;i<inputNodeCount;i++) {
        var nodeName = generateNodeName(0, i);
        layers[0].push({
            "index"  : nodeIndexCounter++,
            "lindex" : i,
            "name"   : nodeName,
            "type"   : "input",
            "layerId": 0,
            "input"  : 0,
            "output" : 0,
            "inConn" : [],
            "outConn": [],
            "firstInLayer" : (i == 0),
            "lastInLayer"  : (i == inputNodeCount - 1)
        });
    }

    for(var i=0;i<hiddenLayerCount.length;i++) {
        layers.push([]);
        for(var j=0;j<hiddenLayerCount[i];j++) {
            var nodeName = generateNodeName(i + 1, j);
            layers[1 + i].push({
                "index"  : nodeIndexCounter++,
                "lindex" : j,
                "name"   : nodeName,
                "type"   : "hidden",
                "layerId": 1 + i,
                "input"  : 0,
                "output" : 0,
                "thres"  : randomWeight(),
                "inConn" : [],
                "outConn": [],
                "firstInLayer" : (j == 0),
                "lastInLayer"  : (j == hiddenLayerCount[i] - 1)
            });
        }
    }

    layers.push([]);
    OUTPUT_LAYER_INDEX = layers.length - 1;
    for(var i=0;i<outputNodeCount;i++) {
        var nodeName = generateNodeName("O", i);
        layers[OUTPUT_LAYER_INDEX].push({
            "index"  : nodeIndexCounter++,
            "lindex" : i,
            "name"   : nodeName,
            "type"   : "output",
            "layerId": OUTPUT_LAYER_INDEX,
            "input"  : 0,
            "output" : 0,
            "target" : 0,
            "inConn" : [],
            "outConn": [],
            "hitTarget" : false,
            "firstInLayer" : (i == 0),
            "lastInLayer"  : (i == outputNodeCount - 1)
        });
    }
    
    for(var i=0;i<layers.length-1;i++) {
        var currentLayer = layers[i];
        var nextLayer    = layers[i+1];
        for(var j=0;j<currentLayer.length;j++) {
            for(var k=0;k<nextLayer.length;k++) {
                var conn = {
                    "id"    : 'conn_' + i + '_' + j + '_' + (i+1) + '_' + k,
                    "name"  : currentLayer[j].name + "," + nextLayer[k].name,
                    "from"  : currentLayer[j],
                    "to"    : nextLayer[k],
                    "weight": randomWeight()
                }; 
                currentLayer[j].outConn.push(conn);
                nextLayer[k].inConn.push(conn);
            }
        }
    }
    
    totalNodeCount = nodeIndexCounter;
    
    
    networkStepper = train();
    
    emitEvent('network_ready', -1, -1);

    
}


self.onmessage = function(event) {
    
    var m = event.data;

    if(m.operation == 'createNetwork') {
        if(!networkInitialized) {
            createNetwork(m.params);
        }
        return;
    }
    
    if(m.operation == 'predict'){
        predictSet = [m.input];
        networkStepper = predict();
        return;
    }
    
    if(m.operation == 'step') {
        currentMode = m.mode;
        networkStepper.next();
        return;
    }
    
};
