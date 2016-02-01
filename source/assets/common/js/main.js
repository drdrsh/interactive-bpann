(function(){
    "use strict";

    appNS.neuralNetwork = null;
    appNS.graph = null;
    appNS.examples = [];
    appNS.exampleColors = [];
    
    var isBusy = false;
    var isTrainingComplete = false;
    
    var networkState = null

    
    //XOR
    var xords = [
        [[1, 0], [1]],
        [[0, 1], [1]],
        [[1, 1], [0]],
        [[0, 0], [0]],
    ];


    var dataset = xords;
    var testset = [
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0]
    ];

    function prepareHelp(){




    }

    function randomColor() {
        var num = Math.floor(Math.random()*16777215).toString(16);
        return "#" + ("000000" + num ).substr(num.length, 6);
    }

    function prepareDatagrid(data) {

        var columns = [{ field: 'recid', caption: 'ID', size: '50px' }];
        var records = [];
        
        for(var i=0;i<data.length;i++) {
            var inputData = data[i][0];
            var outputData= data[i][1];
            var record = {};
            for(var j=0;j<inputData.length;j++) {
                if(i == 0) {
                    var field = {
                        field: 'input_'   + (j + 1),
                        caption: 'Input ' + (j + 1),
                        size: '80px',
                        sortable: true, 
                        resizable: true,
                        render: 'int',
                        editable: {
                            type: 'int',
                            min: 0, 
                            max: 32756 
                        }
                    };
                    columns.push(field);
                }
                var fieldId = 'input_' + (j + 1); 
                record[fieldId] = inputData[j];
            }
            for(var j=0;j<outputData.length;j++) {
                if(i == 0) {
                    var field = {
                        field: 'output_'   + (j + 1),
                        caption: 'Output ' + (j + 1),
                        size: '80px',
                        sortable: true, 
                        resizable: true,
                        render: 'int',
                        editable: {
                            type: 'int',
                            min: 0, 
                            max: 32756 
                        }
                    };
                    columns.push(field);
                }
                var fieldId = 'output_' + (j + 1); 
                record[fieldId] = outputData[j];
            }
            record["recid"] = (i + 1);
            records.push(record);
        }
        
        function getLastInputField() {
            for(var i=1;i<w2ui.grid.columns.length;i++) {
                if(w2ui.grid.columns[i].field.indexOf('input_') != 0) {
                    return w2ui.grid.columns[i].field;
                }
            }
        }
        
        function resetGridFieldNames() {
            var outputCounter = 1;
            var inputCounter = 1;
            for(var i=1;i<w2ui.grid.columns.length;i++) {
                var f = w2ui.grid.columns[i];
                if(f.field.indexOf('input_') == 0) {

                    if('input_' + inputCounter != f.field) {
                        for(var j=0;j<w2ui.grid.records.length;j++) {
                            w2ui.grid.records[j]['input_' + inputCounter] = w2ui.grid.records[j][f.field];
                            delete w2ui.grid.records[j][f.field];
                        }
                    }                    
                    f.field = 'input_' + inputCounter;
                    f.caption = 'Input ' + inputCounter;
                    inputCounter++;
                }
                if(f.field.indexOf('output_') == 0) {
                    
                    if('output_' + outputCounter != f.field) {
                        for(var j=0;j<w2ui.grid.records.length;j++) {
                            w2ui.grid.records[j]['output_' + outputCounter] = w2ui.grid.records[j][f.field];
                            delete w2ui.grid.records[j][f.field];
                        }
                    }                    
                    f.field = 'output_' + outputCounter;
                    f.caption = 'Output ' + outputCounter;
                    outputCounter++;
                }
            }
            w2ui.grid.refresh();
        }
        
        $('#grid').w2grid({ 
            name: 'grid', 
            columns: columns,
            records: records,
            show: { 
                toolbar: true,
                footer: true,
                toolbarSave: false,
                toolbarSearch: false,
                toolbarColumns: false
            },
            toolbar: {
                items: [
                    { id: 'add-record', type: 'button', caption: 'Add Record', icon: 'w2ui-icon-plus' },
                    { id: 'delete-record', type: 'button', caption: 'Delete Record', icon: 'w2ui-icon-minus' },
                    { id: 'add-ofield', type: 'button', caption: 'Add Output Field', icon: 'w2ui-icon-plus' },
                    { id: 'add-ifield', type: 'button', caption: 'Add Input Field', icon: 'w2ui-icon-plus' },
                    { id: 'delete-field', type: 'button', caption: 'Delete Field', icon: 'w2ui-icon-minus' }
                ],
                onClick: function (event) {
                    
                    if (event.target == 'add-record') {
                        w2ui.grid.add({ recid: w2ui.grid.records.length + 1 });
                    }
                    
                    if (event.target == 'delete-record') {
                        w2ui.grid.delete();
                    }
                    
                    if (event.target == 'delete-field') {
                        for(var i=0;i<w2ui.grid.sortData.length;i++) {
                            var n = w2ui.grid.sortData[i].field;
                            //Never delete recid or the last input or output fields
                            if(n == 'recid' || n == 'input_1' || n == 'output_1') {
                                continue;
                            }
                            w2ui.grid.removeColumn(w2ui.grid.sortData[i].field);
                            for(var j=0;j<w2ui.grid.records.length;j++) {
                                delete w2ui.grid.records[j][n];
                            }
                        }
                        resetGridFieldNames();
                    }
                    
                    if (event.target == 'add-ofield') {
                        w2ui.grid.addColumn({
                            field: 'output_'   + 1,
                            caption: 'Output ' + 1,
                            size: '80px',
                            sortable: true, 
                            resizable: true,
                            render: 'int',
                            editable: {
                                type: 'int',
                                min: 0, 
                                max: 32756 
                            }
                        });
                        resetGridFieldNames();
                    }
                    
                    if (event.target == 'add-ifield') {
                        w2ui.grid.addColumn(getLastInputField(), {
                            field: 'input_'   + 1,
                            caption: 'Input ' + 1,
                            size: '80px',
                            sortable: true, 
                            resizable: true,
                            render: 'int',
                            editable: {
                                type: 'int',
                                min: 0, 
                                max: 32756 
                            }
                        });
                        resetGridFieldNames();
                    }
                    
                    
                }
            }
        });
        
    }

  

    var exampleBaseErrors = [];
    var exampleProgress = [];
    var exampleError = [];
    
    function updateNetworkState(alteredNode) {
        var targetNode = networkState[alteredNode.layerIdx][alteredNode.nodeIdx];
        for(var i=0;i<targetNode.inConn.length;i++) {
            var id = targetNode.inConn[i].id;
            targetNode.inConn[i].weight = alteredNode.weights[id];
        }
        for(var idx in alteredNode) {
            if(idx == 'weights') {
                continue;
            }
            targetNode[idx] = alteredNode[idx];
        }
    }
    
    function onNetworkUpdate(event, params) {

        if(event == 'network_ready') {  
            isTrainingComplete = false;
            networkState = params.network;
            doTopolgy();
            $('#controls').removeClass('hidden');
            $('.run').html('Run');

            //Do one epoch
            appNS.neuralNetwork.stepByEpoch(1);
            $('#examples').removeClass('hidden');
            return;
        }
        
        if(event == 'simulation_paused'){
            isBusy = false;
            $('.run').removeAttr('disabled', 'disabled');
            render();
        }
        
        
        if(event == 'example_done') {
            
            var error = 0;
            //Do we have baseline errors? If no, let's calculate them
            if(exampleBaseErrors.length != w2ui.grid.records.length) {
                var outputLayer = networkState[networkState.length-1];
                //loop over output nodes
                for(var i=0;i<outputLayer.length;i++) {
                    error += Math.abs(outputLayer[i].error);
                }
                exampleBaseErrors.push(error / outputLayer.length);
                exampleProgress.push(0);
            } else {
                var outputLayer = networkState[networkState.length-1];
                for(var i=0;i<outputLayer.length;i++) {
                    error += Math.abs(outputLayer[i].error);
                }
                var avgNodeError = error / outputLayer.length;
                var percent = avgNodeError / exampleBaseErrors[params.exampleId];
                if(percent > 1) {
                    percent = 1;
                }
                if(percent < 0) {
                    percent = 0;
                }
                if(exampleProgress[params.exampleId] - ((1-percent) * 100) > 50){
                    //debugger;
                }
                exampleProgress[params.exampleId] = (1 - percent) * 100;

                exampleError[params.exampleId] = avgNodeError;
                //console.log(params.exampleId, avgNodeError);
                //logQueue.push('Example ' + params.exampleId + ' processed with error ' + avgNodeError);
            }
            
            //Update input node labels, and invalidate node ui states
            var inputs = appNS.examples[params.nextExampleId][0];
            for(var i=0;i<networkState.length;i++) {
                for(var j=0;j<networkState[i].length;j++) {
                    if(i == 0) {
                        //Update input layer colors and values
                        networkState[i][j].output = inputs[j];
                        var graphNode = appNS.graph.graph.nodes(networkState[i][j].id);
                        graphNode.sublabel = networkState[i][j].output.toFixed(4);
                        graphNode.color = appNS.exampleColors[params.nextExampleId];
                    } else {
                        networkState[i][j].errorInvalid = true;
                        networkState[i][j].outputInvalid= true;
                    }
                }
            }
        }


        if(event == 'training_done') {
            isBusy = false;
            var nodes = appNS.graph.graph.nodes();
            for (var i = 0; i < nodes.length; i++) {
                nodes[i].color = '#000';
            }
            $('.run').removeAttr('disabled', 'disabled').html('Restart');
            render();
            isTrainingComplete = true;
            $('#example-state-0').click();
        }
        
        /*
        if(event == 'training_done') {
            appNS.neuralNetwork.predict([1, 0]);
            appNS.neuralNetwork.stepByFull();
            appNS.neuralNetwork.predict([0, 1]);
            appNS.neuralNetwork.stepByFull();
            appNS.neuralNetwork.predict([1, 1]);
            appNS.neuralNetwork.stepByFull();
            appNS.neuralNetwork.predict([0, 0]);
            appNS.neuralNetwork.stepByFull();
        }
        
        if(event == 'prediction_done') {
            console.log('Result ', params.output);
            return;
        }
        */
        
        if(event == 'node_ff_done') {
            updateNetworkState(params.node);
            var updateNode = networkState[params.node.layerIdx][params.node.nodeIdx];
            var graphNode = appNS.graph.graph.nodes(updateNode.id);
            updateNode.outputInvalid = false;
            
            var nodes = appNS.graph.graph.nodes();
            for(var i=0;i<nodes.length;i++) {
                if(nodes[i].type != 'input') {
                    nodes[i].color = '#000';
                }
            }
            graphNode.color = '#0f0';
            if(updateNode.type == 'output') {
                graphNode.sidelabel = updateNode.output.toFixed(4);
            }
            //Is this a prediction ff?
            if(isTrainingComplete) {
                render();
                //console.log('rendering');
            }
        }
        
        if(event == 'node_bp_done') {
            updateNetworkState(params.node);

            var updateNode = networkState[params.node.layerIdx][params.node.nodeIdx];
            var graphNode = appNS.graph.graph.nodes(updateNode.id);
            updateNode.errorInvalid = false;
            
            var nodes = appNS.graph.graph.nodes();
            for(var i=0;i<nodes.length;i++) {
                if(nodes[i].type != 'input') {
                    nodes[i].color = '#000';
                }
            }
//            console.log(event, params);
            graphNode.color = '#f00';
            
            graphNode.sublabel = updateNode.thres?updateNode.thres.toFixed(4):'';

            for(var i=0;i<updateNode.inConn.length;i++) {
                var conn = updateNode.inConn[i];
                appNS.graph.graph.edges(conn.id).label = conn.weight.toFixed(4);
            }
        }
    }
    
    function validateData(data) {
        return true;
    }

    function render() {
        
        if(appNS.graph) {
            appNS.graph.render();
        }

        for(var i=0;i<exampleProgress.length;i++) {
            $('#example-state-' + i + ' .example-number').html(i+1);
            $('#example-state-' + i + ' progress').attr('value', exampleProgress[i]);
        }
        
        for(var i=0;i<exampleError.length;i++) {
            $('#example-state-' + i + ' .example-error').html(exampleError[i].toFixed(4));
        }        
        
        if(isBusy) {
            window.requestAnimationFrame(render);
        }
    }
    
    function displayTooltip(text, x, y) {

        if ($('#tooltip').length === 0) {
            $('body').prepend($('<div />').attr('id', 'tooltip'));
        }
        var tt = $('#tooltip').html("");
        var tooltipHeight = 30;

        var xBorder = x + tt.width() + 30;
        if (xBorder > $(window).width()){
            x -= (xBorder - $(window).width());
        }

        var yBorder = y + tt.height() + 30;
        if (yBorder > $(window).height()) {
            y -= (tooltipHeight * 2);
        }
        
        tt.append(text);
        tt.css('left', x);
        tt.css('top',  y);
        tt.css('display', 'block');
    }

    function hideTooltip() {
        $('#tooltip').css('display', 'none');
    }



    document.addEventListener("DOMContentLoaded", function(event) {

        $('#about-dialog').dialog({
            autoOpen: false,
            modal: true,
            maxWidth:600,
            maxHeight: 500,
            width: 600,
            height: 500,
            buttons: {
                "Take a tour" : function() {
                    $('.help').click()
                    $('#about-dialog').dialog('close');
                },
                "Build your own Network" : function() {
                    $('#about-dialog').dialog('close');
                    if($('#menu .open').length == 0){
                        $('#menu').click();
                    }
                }
            }
        });
        $('#about-dialog').dialog('open');

        $('#menu').click(function(){
            if(isBusy){
                return;
            }
            $('#top-panel').toggleClass("is-slid");
            $('#menu a').toggleClass("open");
            appNS.helpEngine.close();
 
        });

        $('.run').click(function() {
            //Close an open menu
            if($('#menu .open').length){
                $('#menu').click();
            }
            if(isTrainingComplete) {
                $('.build').click();
                return;
            }
            if(isBusy || !appNS.neuralNetwork) {
                return;
            }
            
            var $button = $(this);
            $button.attr('disabled', 'disabled');
            var mode = $('input[name=step-mode]:checked').val()
            var steps= $('#number-of-steps').val();
            isBusy = true;
            appNS.neuralNetwork.stepBy(mode, steps);
            render();
        });

        $( ".about" ).click(function() {
            if(isBusy){
                return;
            }
            $('#about-dialog').dialog('open');
        });

        $( ".help" ).click(function() {
            if(isBusy){
                return;
            }
            if(!appNS.graph) {
                $('.build').click();
            }
            setTimeout(function(){
                appNS.helpEngine.start();
            }, 500);
        });

        $( ".build" ).click(function(){
            if(isBusy) {
                return;
            }
            var data = w2ui.grid.records;
            if(!validateData(data)) {
                alert("Invalid data, please make sure all the data are numerical and no missing data exist");
                return;
            }
            
            if(appNS.neuralNetwork) {
                appNS.neuralNetwork.destroy();
                appNS.graph.graph.clear();
                appNS.graph.refresh();
                appNS.graph.kill();
                $('#graph').remove();
                $('#examples').addClass('hidden');
                $('#controls').addClass('hidden');
                networkState = [];
                exampleBaseErrors = [];
                exampleProgress = [];
                exampleError = [];
            }
            
            
            appNS.examples = [];
            appNS.exampleColors = [];
            for(var i=0;i<data.length;i++) {
                var rec = [[],[]];
                
                for(var idx in data[i]) {
                    
                    if(idx.indexOf('input_') == 0) {
                        rec[0].push(data[i][idx]);
                    }

                    if(idx.indexOf('output_') == 0) {
                        rec[1].push(data[i][idx]);
                    }
                }
                appNS.examples.push(rec);
                appNS.exampleColors.push(randomColor());
            }

            var epochs = $('#number-of-epochs').val();
            var learningRate = $('#learning-rate').val();
            var tolerance = $('#tolerance').val();
            
            var $nodeSelects = $('#number-of-nodes-container select');
            var hiddenLayerCount = [];
            $.each($nodeSelects, function(idx, obj) {
                hiddenLayerCount.push(parseInt($(obj).val(), 10));
            });
            appNS.neuralNetwork = new appNS.ANN({
                assetsPath: "./assets/common/",
                trainingDataset : appNS.examples,
                onUpdate : onNetworkUpdate,
                epochs: epochs,
                hiddenLayerCount: hiddenLayerCount,
                learningRate: learningRate,
                tolerance: tolerance
            });
            if( $('#top-panel').hasClass('is-slid') ) {
                $('#menu').click();
            }
        });
        
        /*
        $( "#tabs" ).tabs({
            collapsible: true,
            activate: function(ev, ui) {
                if(ui.newTab.context && ui.newTab.context.id == 'data-tab-a') {
                    w2ui.grid.reset(false);
                }
            }
        });
        */
        $('#number-of-layers').change(function(){
            var $this = $(this);
            var value = parseInt($this.val(), 10);
            if(isNaN(value) || value < 1) {
                $this.val(1);
                $this.change();
                return;
            }
            if(value > 10) {
                $this.val(10);
                $this.change();
                return;
            }
            var previousValues = [];
            var $selects = $('#number-of-nodes-container select');
            $.each($selects, function(idx, obj) {
                previousValues.push($(obj).val());
            });
            
            $selects.remove();
            for(var i=0;i<value;i++) {
                var domSel = $('<select>');
                var targetVal = previousValues[i]?previousValues[i]:3;

                for(var j=2;j<8;j++) {
                    var domOpt = $('<option>').val(j).html(j);
                    if(j == targetVal) {
                        domOpt.attr('selected', 'selected');
                    }
                    domSel.append(domOpt);
                }
                $('#number-of-nodes-container').append(domSel);
            }
        });

        $('#number-of-layers').change();
        prepareDatagrid(xords);
    });


    function doTopolgy(){

        var layers = networkState;

        var i;
        var g = {
            nodes: [],
            edges: []
        };



        var width = 1;
        var height = 1;
        var nodeSpacingX = 0.1;
        var nodeSpacingY = 0.05;
        var nodeWidth   = 0.2;
        var nodeHeight  = 0.2;
        var nodes = [];
        var links = [];
        var bgs = [];
        var nodeCounter = 0;

        for(var i=0;i<layers.length;i++) {

            var nodeCount   = layers[i].length;
            var layerHeight = (nodeCount * nodeHeight) + ( (nodeCount - 1) * nodeSpacingY);
            var layerWidth  =  nodeWidth + (nodeSpacingX * 2);
            var layerX = width + (layerWidth * i) + layerWidth
            var layerY = (height/2) - (layerHeight/2);
            for(var j=0; j<layers[i].length;j++) {
                var node = layers[i][j];
                var type = 'hidden';
                if(i == 0) {
                    type = 'input';
                }
                if(i == layers.length - 1) {
                    type = 'output';
                }

                g.nodes.push({
                    x       : layerX,
                    y       : layerY + (j * nodeHeight) + ( (j-1) * nodeSpacingY),
                    type    : type,
                    layerIdx: i,
                    nodeIdx : j,
                    id : node.id,
                    label: node.name,
                    size:  nodeWidth * 50,
                    color: '#666'
                });
                
                nodeCounter++;
                for(var k=0; k<layers[i][j].outConn.length; k++) {
                    g.edges.push({
                        layerIdx  : i,
                        nodeIdx   : j,
                        connIdx   : k,
                        id: node.outConn[k].id,
                        source: node.outConn[k].from.id,
                        target: node.outConn[k].to.id,
                        size: 5000,
                        label: node.outConn[k].weight.toFixed(3),
                        color: '#ccc',
                        hover_color: '#000',
                        type: 'arrow'
                    });
                }
            }

        }
        
        $('#top-panel').append('<div id="graph"></div>');
        appNS.graph = new sigma({
            graph: g,
            renderer: {
                container: document.getElementById('graph'),
                type: 'canvas'
            },
            settings: {
                minEdgeSize: 3,
                maxEdgeSize: 3,
                minNodeSize: 25,
                maxNodeSize: 25,
                minArrowSize: 15,
                edgeLabelColor: 'edge'
            }
        });
        
        //outNode clickNode doubleClickNode rightClickNode
        appNS.graph.bind('outNode', function(e) {
            var edges = appNS.graph.graph.edges();
            for(var i=0;i<edges.length;i++) {
                edges[i].color = '#aaa';
            }
            render();
            hideTooltip();
        });
        
        appNS.graph.bind('overNode', function(e) {

            var node = networkState[e.data.node.layerIdx][e.data.node.nodeIdx];
            
            var vw = {
                input  : (node.input && (!node.outputInvalid || isTrainingComplete))?node.input.toFixed(4):'N/A',
                thres  : (node.thres)?node.thres.toFixed(4):'N/A',
                output : (!node.outputInvalid|| isTrainingComplete)?node.output.toFixed(4):'N/A',
                error  : (node.error && (!node.errorInvalid || isTrainingComplete))?node.error.toFixed(4):'N/A'
            }

            var rendererId = e.data.renderer.conradId;

            if(isTrainingComplete) {
                displayTooltip(tmpl("tooltip_tmpl", vw),
                    e.data.node['renderer' + rendererId + ':x'] - e.data.node['renderer' + rendererId + ':size'],
                    e.data.node['renderer' + rendererId + ':y'] + e.data.node['renderer' + rendererId + ':size']
                );
            }

            var edges = appNS.graph.graph.edges();
            for(var i=0;i<edges.length;i++) {
                edges[i].color = 'rgba(0,0,0,0)';
            }
            
            for(var i=0;i<node.inConn.length;i++) {
                var edge = appNS.graph.graph.edges(node.inConn[i].id);
                edge.color = '#a00';
            }
            
            for(var i=0;i<node.outConn.length;i++) {
                var edge = appNS.graph.graph.edges(node.outConn[i].id);
                edge.color = '#0a0';
            }
            render();
        });
        
        
        var data = w2ui.grid.records;
        
        $('#examples tbody').html('');
        for(var i=0;i<data.length;i++) {
            $('#examples tbody').append(tmpl("example_meter", {exampleColor: appNS.exampleColors[i] ,exampleId:i}));
        }
        $('#examples tr').click(function(){
            if(!isTrainingComplete) {
                return;
            }
            var exampleId = $(this).attr('data-example-id');
            var input = appNS.examples[exampleId][0];

            for(var j=0;j<networkState[0].length;j++) {
                //Update input layer colors and values
                networkState[0][j].output = input[j];
                var graphNode = appNS.graph.graph.nodes(networkState[0][j].id);
                graphNode.sublabel = networkState[0][j].output.toFixed(4);
                graphNode.color = appNS.exampleColors[exampleId];
            }
            appNS.neuralNetwork.predict(input);
        });

        window.requestAnimationFrame(render);
    }
}());