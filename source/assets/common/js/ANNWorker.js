"use strict";
//console.profile("MyProfile");

var networkInitialized = false;
var trainingSet = [];
var predictSet = [];

var pauseFlag = false;
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
var currentStep = 0;
var maxSteps = 0;
var maxEpochs = -1;
var maxExamples = -1;
var networkStepper = null;

function generateLinkName(layerIdx1, nodeIdx1, layerIdx2, nodeIdx2) {
    return "From " + generateNodeName(layerIdx1, nodeIdx1) + 
           " To "  + generateNodeName(layerIdx2, nodeIdx2);
}

function generateLinkId(layerIdx1, nodeIdx1, layerIdx2, nodeIdx2) {
    return generateNodeId(layerIdx1, nodeIdx1) + "_" + generateNodeId(layerIdx2, nodeIdx2);
}

function generateNodeId(layerIdx, nodeIdx) {
    return "L" + layerIdx + "N" + nodeIdx;
}
function generateNodeName(layerIdx, nodeIdx) {
    if(layerIdx == 0) {
        return "Input " + (nodeIdx + 1);
    }else if(layerIdx == OUTPUT_LAYER_INDEX) {
        return "Output " + (nodeIdx + 1);
    } else {
        return "Hidden "  + layerIdx + "," + (nodeIdx + 1);
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
function emitExampleEvent(exampleId, isAllExampleCorrect) {
    
    var newExampleId = exampleId;
    
    if(!isAllExampleCorrect) {
        /* This means we will do more epochs which means a new example will be fed to the network
        * then we update input nodes states
        */
        newExampleId = exampleId + 1;
        if(newExampleId == maxExamples) {
            newExampleId = 0;
        }
    }
    
    self.postMessage({
        'event'        : 'example_done',
        'exampleId'    : exampleId,
        'nextExampleId': newExampleId
    });
}
function emitNetworkReadyEvent() {
    self.postMessage({
        'event'     :'network_ready',
        'network'   : layers
    });
}
function emitPlainEvent(eventId) {
    self.postMessage({
        'event': eventId
    });
}
function serializeNode(layerIdx, nodeIdx) {
    var newNode = {
        layerIdx: layerIdx,
        nodeIdx: nodeIdx,
        weights: {}
    };
    var nodeRef = layers[layerIdx][nodeIdx];
    var cpy = ['id', 'error', 'thres', 'input', 'output'];
    for(var i=0;i<cpy.length;i++) {
        newNode[cpy[i]] = nodeRef[cpy[i]];
    }
    
   for(var i=0;i<nodeRef.inConn.length;i++) {
        newNode.weights[nodeRef.inConn[i].id] = nodeRef.inConn[i].weight;
   }
   return newNode;
}

function emitNodeEvent(eventId, layerIdx, nodeIdx) {
    var node = serializeNode(layerIdx, nodeIdx);
    //console.log(node.id, node.input , node.output);
    self.postMessage({
        'event'    : eventId,
        'layerIdx' : layerIdx,
        'nodeIdx'  : nodeIdx,
        'node'     : node
    });
}

function emitLayerEvent(eventId, layerId, nodeId) {
}

function emitEpochEvent(epochId) {
    self.postMessage({
        'event'         :'epoch_done',
        'epochsElapsed' : epochId,
        'epochsLeft'    : maxEpochs - epochId
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
            emitNodeEvent('node_ff_done', currentLayer, currentNode);
            if(currentMode == 'node') {
                emitEvent('simulation_paused');
                yield 1;
            }
        }
        emitLayerEvent('layer_ff_done', currentLayer);
        if(currentMode == 'layer') {
            emitEvent('simulation_paused');
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
                    emitNodeEvent('node_ff_done', currentLayer, currentNode);
                    if(currentMode == 'node') {
                        currentStep++;
                        if(currentStep == maxSteps) {
                            emitPlainEvent('simulation_paused');
                            yield 1;
                        }
                    }
                }
                emitLayerEvent('layer_ff_done', currentLayer);
                if(currentMode == 'layer') {
                    currentStep++;
                    if(currentStep == maxSteps) {
                        emitPlainEvent('simulation_paused');
                        yield 2;
                    }
                }
            }
            
            
            //Backpropagate
            if(!allOutputsCorrect) {
                for(currentLayer=layers.length - 1;currentLayer>=1;currentLayer--) {
                    for(currentNode=layers[currentLayer].length - 1;currentNode>=0;currentNode--) {
                        backPropagateNode(currentLayer, currentNode);
                        emitNodeEvent('node_bp_done', currentLayer, currentNode);
                        if(currentMode == 'node'){
                            currentStep++;
                            if(currentStep == maxSteps) {
                                emitPlainEvent('simulation_paused');
                                yield 3;
                            }
                        }
                    }
                    emitLayerEvent('layer_bp_done', currentLayer);
                    if(currentMode == 'layer') {
                        currentStep++;
                        if(currentStep == maxSteps) {
                            emitPlainEvent('simulation_paused');
                            yield 4;
                        }
                    }
                }
            }
           

            allExamplesCorrect = allExamplesCorrect && allOutputsCorrect;

            emitExampleEvent(currentExample, allExamplesCorrect);
            if(currentMode == 'example') {
                currentStep++;
                if(currentStep == maxSteps) {
                    emitPlainEvent('simulation_paused');
                    yield 5;
                }
            }                
        }
        
        
        emitEpochEvent(currentEpoch);
        if(currentMode == 'epoch') {
           currentStep++;
            if(currentStep == maxSteps) {
                emitPlainEvent('simulation_paused');
                yield 6;
            }
        }
        
        if(allExamplesCorrect) {
            break;
        } 
        //yield 10;
    }
    
    emitPlainEvent('training_done');
    //console.profileEnd();
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
            "id"     : generateNodeId(0, i),
            "name"   : nodeName,
            "type"   : "input",
            "layerId": 0,
            "input"  : 0,
            "output" : 0,
            "errorInvalid"  : false,
            "outputInvalid" : false,
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
                "id"     : generateNodeId(i + 1, j),
                "type"   : "hidden",
                "layerId": 1 + i,
                "input"  : 0,
                "output" : 0,
                "errorInvalid"  : false,
                "outputInvalid" : false,
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
        var nodeName = generateNodeName(OUTPUT_LAYER_INDEX, i);
        layers[OUTPUT_LAYER_INDEX].push({
            "index"  : nodeIndexCounter++,
            "lindex" : i,
            "name"   : nodeName,
            "id"     : generateNodeId(OUTPUT_LAYER_INDEX, i),
            "type"   : "output",
            "layerId": OUTPUT_LAYER_INDEX,
            "input"  : 0,
            "output" : 0,
            "target" : 0,
            "errorInvalid"  : false,
            "outputInvalid" : false,
            "thres"  : randomWeight(),
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
                    "id"    : generateLinkId(i, j, i+1, k),
                    "name"  : generateLinkName(i, j, i+1, k),
                    "from"  : currentLayer[j],
                    "to"    : nextLayer[k],
                    "weight": randomWeight()
                }; 
                //console.log(conn.id);
                currentLayer[j].outConn.push(conn);
                nextLayer[k].inConn.push(conn);
            }
        }
    }
    
    totalNodeCount = nodeIndexCounter;
    initMarginNodes(0);
    //Feedforward
    for(var i=1;i<layers.length;i++) {
        for(var j=0;j<layers[i].length;j++) {
            feedForwardNode(i, j);
        }
    }
    
    networkStepper = train();
    
    emitNetworkReadyEvent();
    
    
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
        maxSteps = m.count?m.count:1;
        currentStep = 0;
        networkStepper.next();
        return;
    }

    /*
        Worker is single threaded so it cannot processes messages 
        while the loop is running, this means it cannot be paused
        I will need to make the loop check for signals every now 
        and then
    */
    if(m.operation == 'pause') {
        /*
        if(pauseFlag) {
            pauseFlag = false;
            networkStepper.next();
            return;
        }
        pauseFlag = true;
        return;
        */
    }
    
};
