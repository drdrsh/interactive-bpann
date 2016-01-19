(function(){
    "use strict";
    
    class ANN {
    
        constructor(params) {
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
            this.params = ANN.extend(defaults, params);
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
            }
            this._worker.postMessage({
                'operation' : 'createNetwork',
                'params'    : networkSettings
            });
            
        }
        
        predict(instance) {
            this._worker.postMessage({'operation' : 'predict', 'input' : instance });
        }
        
        stepByFull(){
            this._worker.postMessage({'operation' : 'step', 'mode': 'full'});
        }

        stepByEpoch(){
            this._worker.postMessage({'operation' : 'step', 'mode': 'epoch'});
        }
        
        stepByExample(){
            this._worker.postMessage({'operation' : 'step', 'mode': 'example'});
        }
        
        stepByLayer(){
            this._worker.postMessage({'operation' : 'step', 'mode': 'layer'});
        }
        
        stepByNode(){
            this._worker.postMessage({'operation' : 'step', 'mode': 'node'});
        }
        
        stepBy(mode) {
            this._worker.postMessage({'operation' : 'step', 'mode': mode});
        }
        
        static extend (obj1, obj2) { 
            var result = obj1, val;
            for (val in obj2) {
                if (obj2.hasOwnProperty(val)) {
                    result[val] = obj2[val];
                }
            }
            return result;
        }

    }
    
    appNS.ANN = ANN;
}());