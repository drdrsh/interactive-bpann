(function(){
    "use strict";

    var ANN = function(params){
        var nparams = ['epochs', 'hiddenLayerCount', 'learningRate', 'tolerance', 'trainingDataset'];
        var defaults = {
            epochs: 5000,
            hiddenLayerCount: [4],
            learningRate: 1,
            tolerance: 0.05,
            trainingDataset : [],
            onUpdate : null
        };


        this._worker = new Worker(params.assetsPath + '/js/ANNWorker.js');
        this.params = extend(defaults, params);
        var networkSettings = {};
        for(var i=0;i<nparams.length;i++) {
            networkSettings[nparams[i]] = this.params[nparams[i]];
        }

        var self = this;
        this._worker.onmessage = function(msg) {
            var eventData = msg.data;
            if(typeof self.params.onUpdate == "function") {
                self.params.onUpdate(eventData.event, eventData);
            }
        };
        this._worker.postMessage({
            'operation' : 'createNetwork',
            'params'    : networkSettings
        });
    };

    ANN.prototype.destroy = function() {
        this._worker.terminate();
        this._worker = null;
    };


    ANN.prototype.predict = function(instance) {
        this._worker.postMessage({'operation' : 'predict', 'input' : instance });
    };

    ANN.prototype.pause = function() {
        this._worker.postMessage({'operation' : 'pause'});
    };

    ANN.prototype.stepByFull = function() {
        this._worker.postMessage({'operation' : 'step', 'mode': 'full'});
    };

    ANN.prototype.stepByEpoch = function(count) {
        this._worker.postMessage({'operation' : 'step', 'mode': 'epoch', 'count': count});
    };

    ANN.prototype.stepByExample = function(count) {
        this._worker.postMessage({'operation' : 'step', 'mode': 'example', 'count': count});
    };

    ANN.prototype.stepByLayer = function(count) {
        this._worker.postMessage({'operation' : 'step', 'mode': 'layer', 'count': count});
    };

    ANN.prototype.stepByNode = function(count) {
        this._worker.postMessage({'operation' : 'step', 'mode': 'node', 'count': count});
    };


    ANN.prototype.stepBy = function(mode, count) {
        this._worker.postMessage({'operation': 'step', 'mode': mode, 'count': count});
    };


    function extend (obj1, obj2) {
        var result = obj1, val;
        for (val in obj2) {
            if (obj2.hasOwnProperty(val)) {
                result[val] = obj2[val];
            }
        }
        return result;
    }

    appNS.ANN = ANN;

}());