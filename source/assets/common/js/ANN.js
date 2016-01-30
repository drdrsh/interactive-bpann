(function(){
    "use strict";
    
    class ANN {
    
        destroy() {
            this._worker.terminate();
            this._worker = null;
        }
        
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
            console.log(instance);
            this._worker.postMessage({'operation' : 'predict', 'input' : instance });
        }
        
        pause() {
            this._worker.postMessage({'operation' : 'pause'});
        }
        
        stepByFull(){
            this._worker.postMessage({'operation' : 'step', 'mode': 'full'});
        }

        stepByEpoch(count){
            this._worker.postMessage({'operation' : 'step', 'mode': 'epoch', 'count': count});
        }
        
        stepByExample(count){
            this._worker.postMessage({'operation' : 'step', 'mode': 'example', 'count': count});
        }
        
        stepByLayer(count){
            this._worker.postMessage({'operation' : 'step', 'mode': 'layer', 'count': count});
        }
        
        stepByNode(count){
            this._worker.postMessage({'operation' : 'step', 'mode': 'node', 'count': count});
        }
        
        stepBy(mode, count) {
            this._worker.postMessage({'operation' : 'step', 'mode': mode, 'count': count});
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