(function(){
    "use strict";

    appNS.neuralNetwork = null;
    appNS.graph = null;
    
    var isBusy = false;
    var isStepByStep = true;
    
    var networkState = null
    var logQueue = [];

    var simpleinput = [
        [[0.35, 0.9], [0.5]]
    ]
    //OR
    var ords = [
        [[1, 0], [1]],
        [[0, 1], [1]],
        [[1, 1], [1]],
        [[0, 0], [0]],
    ];
    //AND
    var andds = [
        [[1, 0], [0]],
        [[0, 1], [0]],
        [[1, 1], [1]],
        [[0, 0], [0]],
    ];
    //XOR
    var xords = [
        [[1, 0], [1,1]],
        [[0, 1], [1,1]],
        [[1, 1], [0,0]],
        [[0, 0], [0,0]],
    ];


    var dataset = xords;
    var testset = [
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0]
    ];

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
                toolbarSave: true
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

    /*
    function prepareDatagrid(data) {
        
        var fields = [];
        for(var idx in data[0]) {
            var fieldName = "field_" + idx;
            if(idx == data[0].length - 1) {
                //Last field?
                fieldName = "output";
            }
            fields.push({
                "name": fieldName,
                "type": number,
                "width": 50
            });
        }
        fields.push({
            type: "control",
            modeSwitchButton: false,
            editButton: false,
            headerTemplate: function() {
                return $("<button>").attr("type", "button").text("Add")
                        .on("click", function () {
                            showDetailsDialog("Add", {});
                        });
            }
        });

        
        $("#jsGrid").jsGrid({
            height: "70%",
            width: "100%",
            editing: true,
            autoload: true,
            paging: true,
            deleteConfirm: function(item) {
                return "The client \"" + item.Name + "\" will be removed. Are you sure?";
            },
            rowClick: function(args) {
                showDetailsDialog("Edit", args.item);
            },
            controller: db,
            fields: fields
        });
     
        $("#detailsDialog").dialog({
            autoOpen: false,
            width: 400,
            close: function() {
                $("#detailsForm").validate().resetForm();
                $("#detailsForm").find(".error").removeClass("error");
            }
        });
     
        $("#detailsForm").validate({
            rules: {
                name: "required",
                age: { required: true, range: [18, 150] },
                address: { required: true, minlength: 10 },
                country: "required"
            },
            messages: {
                name: "Please enter name",
                age: "Please enter valid age",
                address: "Please enter address (more than 10 chars)",
                country: "Please select country"
            },
            submitHandler: function() {
                formSubmitHandler();
            }
        });
     
        var formSubmitHandler = $.noop;
     
        var showDetailsDialog = function(dialogType, client) {
            $("#name").val(client.Name);
            $("#age").val(client.Age);
            $("#address").val(client.Address);
            $("#country").val(client.Country);
            $("#married").prop("checked", client.Married);
     
            formSubmitHandler = function() {
                saveClient(client, dialogType === "Add");
            };
     
            $("#detailsDialog").dialog("option", "title", dialogType + " Client")
                    .dialog("open");
        };
     
        var saveClient = function(client, isNew) {
            $.extend(client, {
                Name: $("#name").val(),
                Age: parseInt($("#age").val(), 10),
                Address: $("#address").val(),
                Country: parseInt($("#country").val(), 10),
                Married: $("#married").is(":checked")
            });
     
            $("#jsGrid").jsGrid(isNew ? "insertItem" : "updateItem", client);
     
            $("#detailsDialog").dialog("close");
        };
     
    }
    */

    function generateValues() { 

        var posx = [];
        var posy = [];
        var negx = [];
        var negy = [];
        
        for(var c=0;c<5000;c++) {
            var rx = Math.random();
            var ry = Math.random();
            /*
            if(rx >= 0.5)rx = 1;
            if(rx < 0.5) rx = 0;
            if(ry >= 0.5)ry = 1;
            if(ry < 0.5) ry = 0;
            */
            var rz = predict([rx,ry])[0];
            if(rz > 0.5) {
                posx.push(rx);
                posy.push(ry);
            } else {
                negx.push(rx);
                negy.push(ry);
            }
        }
        
        var positive = {
          x: posx,
          y: posy,
          mode: 'markers',
          type: 'scatter'
        };
        
        var negative = {
          x: negx,
          y: negy,
          mode: 'markers',
          type: 'scatter'
        };
        
        var data = [ positive, negative ];
        var layout = {
            title :'Line and Scatter Plot'
        };
        Plotly.newPlot('y', data, layout);
    }

    var exampleBaseErrors = [];
    var exampleProgress = [];
    
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
            networkState = params.network;
            doTopolgy();
            return;
        }
        
        if(event == 'simulation_paused'){
            isBusy = false;
            $('#logger textarea').val($('#logger textarea').val() + "\n" + logQueue.join("\n"));
            $('#logger textarea').get(0).scrollTop = $('#logger textarea').get(0).scrollHeight;
            logQueue = [];
        }
        
        
        if(event == 'example_done') {
            
            var error = 0;
            if(exampleBaseErrors.length != w2ui.grid.records.length) {
                for(var i=0;i<networkState[networkState.length-1].length;i++) {
                    error += Math.abs(networkState[networkState.length-1][i].error);
                }
                exampleBaseErrors.push(error / networkState[networkState.length-1].length);
                exampleProgress.push(0);
            } else {
                for(var i=0;i<networkState[networkState.length-1].length;i++) {
                    error += Math.abs(networkState[networkState.length-1][i].error);
                }
                var avgNodeError = error / networkState[networkState.length-1].length;
                var percent = avgNodeError / exampleBaseErrors[params.exampleId];
                if(percent > 1) {
                    percent = 1;
                }
                if(percent < 0) {
                    percent = 0;
                }
                exampleProgress[params.exampleId] = (1 - percent) * 100;
                //logQueue.push('Example ' + params.exampleId + ' processed with error ' + avgNodeError);
            }
        }
        
        if(event == 'training_done') {
            isBusy = false;
            $('#logger textarea').val($('#logger textarea').val() + logQueue.join("\n"));
            $('#logger textarea').get(0).scrollTop = $('#logger textarea').get(0).scrollHeight;
            logQueue = [];
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
        
        if(event == 'node_bp_done') {
            updateNetworkState(params.node);

            var updateNode = networkState[params.node.layerIdx][params.node.nodeIdx];
            if(isStepByStep) {
                logQueue.push('Error at ' + updateNode.name + ' = ' + updateNode.error.toFixed(4));
            }
            
            var nodes = appNS.graph.graph.nodes();
            for(var i=0;i<nodes.length;i++) {
                nodes[i].color = '#000';
            }
            appNS.graph.graph.nodes(updateNode.id).color = '#f00';
            
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
            appNS.graph.refresh();
        }
        
        for(var i=0;i<exampleProgress.length;i++) {
            //$('#example-state-' + i + ' span').css('width', exampleProgress[i] + '%');
            $('#example-state-' + i + ' progress').attr('value', exampleProgress[i]);
        }
        
        
        window.requestAnimationFrame(render);
    }
    
    document.addEventListener("DOMContentLoaded", function(event) { 

        $('.step').click(function() {
            if(isBusy || !appNS.neuralNetwork) {
                return;
            }
            console.log('asd');
            var $button = $(this);
            var mode = $button.attr('data-mode');
            isStepByStep = (mode != 'full');
            isBusy = true;
            appNS.neuralNetwork.stepBy(mode);
        });
        
        $( ".build" ).click(function(){
            var data = w2ui.grid.records;
            var annData = [];
            if(!validateData(data)) {
                alert("Invalid data, please make sure all the data are numerical and no missing data exist");
                return;
            }
            
            if(appNS.neuralNetwork) {
            //    NeuralNetwork.destroy();
                //svg.selectAll('*').remove();
            }
            
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
                annData.push(rec);
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
                trainingDataset : annData,
                onUpdate : onNetworkUpdate,
                epochs: epochs,
                hiddenLayerCount: hiddenLayerCount,
                learningRate: learningRate,
                tolerance: tolerance,
            });
            $( "#params-tab-a" ).click();
        });
        
        $( "#tabs" ).tabs({
            collapsible: true,
            activate: function(ev, ui) {
                if(ui.newTab.context && ui.newTab.context.id == 'data-tab-a') {
                    w2ui.grid.reset(false);
                }
            }
        });
        
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
            $('#number-of-nodes-container select').remove();
            for(var i=0;i<value;i++) {
                var domSel = $('<select>');
                for(var j=2;j<8;j++) {
                    var domOpt = $('<option>').val(j).html(j);
                    if(j == 3) {
                        domOpt.attr('selected', 'selected');
                    }
                    domSel.append(domOpt);
                }
                $('#number-of-nodes-container').append(domSel);
            }
        });

        $('#number-of-layers').change();
        prepareDatagrid(xords);

        /*
                        var layerCount = $('#number-of-layer').val();
                    var layerNodeCounts = [];
                    var $nodeCountSelect = $('#number-of-nodes-container select');
                    $.each($nodeCountSelect, function(idx, obj) {
                        layerNodeCounts.push($(obj).val());
                    });
                    NeuralNetwork = new ANN({
                        trainingDataset : xords,//simpleinput,
                        onUpdate : onNetworkUpdate
                    });
    */
        //initialize();
        //doTopolgy();
        //var rz = predict([0,0])[0];
        //console.log(rz);
        //generateValues();
        
    });


    function doTopolgy(){

        var layers = networkState;

        var i;
        var g = {
            nodes: [],
            edges: []
        };



        // Instantiate sigma:
        /*
    */

        var width = 1;
        var height = 1;
        var nodeSpacingX = 0.5;
        var nodeSpacingY = 0.1;
        var nodeWidth   = 0.05;
        var nodeHeight  = 0.05;
        var nodes = [];
        var links = [];
        var bgs = [];
        var nodeCounter = 0;

        for(var i=0;i<layers.length;i++) {

            var nodeCount  = layers[i].length;
            var layerWidth = (nodeCount * nodeWidth) + ( (nodeCount - 1) * nodeSpacingX);
            var layerHeight=  nodeHeight + (nodeSpacingY * 2);
            var layerX = (width/2) - (layerWidth/2);
            var layerY = height - (layerHeight * i) - layerHeight;
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
                    x       : layerX + (j * nodeWidth) + ( (j-1) * nodeSpacingX),
                    y       : layerY,
                    type    : type,
                    layerIdx: i,
                    nodeIdx : j,
                    id : node.id,
                    label: node.name,
                    size:  nodeWidth,
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
                        size: 2.5,
                        label: node.outConn[k].weight.toFixed(3),
                        color: '#ccc',
                        hover_color: '#000',
                        type: 'curved'
                    });
                }
            }

        }
        
        appNS.graph = new sigma({
            graph: g,
            renderer: {
                container: document.getElementById('graph'),
                type: 'canvas'
            },
            settings: {
            }
        });
        var data = w2ui.grid.records;
        
        $('#examples ol').html('');
        for(var i=0;i<data.length;i++) {
            $('#examples ol').append(tmpl("example_meter", {exampleId:i}));
        }
        
        window.requestAnimationFrame(render);
    }
}());