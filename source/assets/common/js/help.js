(function(){
    "use strict";

    var currentBubbleParams = null;
    var helpStrings = [];
    helpStrings.push(
        'This is an input node, below the node you see the current value being output by this node<br> \
         The color of the node corresponds to the current "example" being fed to the network, it matches \
         the color of the example in the table on the right hand side \
     ');
    helpStrings.push(
        'This is a hidden node, below the node you see the current threshold value for this node<br> \
         A node that is <span style="color:red">RED</span> means that backpropbagtion calculations are currently \
         being performed on this node.<br> \
         A node that is <span style="color:green">GREEN</span> means that feedforward calculations are currently \
         being performed on this node.<br> \
         Hovering over a node will show the incoming and outgoing connections and their corresponding weights \
     ');
    helpStrings.push(
        'This is an output node, it is similar to the hidden node except that there is a value written on its right, \
         this is the current output value of this node \
     ');
    helpStrings.push(
        'Down here are the controls, You can define the type of steps to take and how many of those, e.g. (5 epochs), \
         or you can opt for a full run (either until the network converges or the epoch limit is hit).\
     ');
    helpStrings.push(
        'There are the examples used for training, each example is given a unique color (no guarantees though :P). The \
         progress bar for each example shows you how far is the network from converging on an answer for that particular\
         example. After the training terminates (either due to convergence or reaching the epoch limit), clicking any of \
         these examples will feed that example in the network and show you the state of each node.\
     ');


    var currentStep = 0;
    var steps = [];

    function onNext() {
        if (currentStep == steps.length - 1) {
            onClose();
        } else {
            next();
        }
    }

    function onPrevious() {
        previous();
    }

    function onClose() {
        $('#help-bubble').remove();
        currentStep = 0;
        sigma.misc.animation.camera(
            appNS.graph.camera,
            {
                x: 0,
                y: 0,
                ratio: 1
            },
            {duration: appNS.graph.settings('animationsTime') || 300}
        );
        //$('#menu').click();
    }

    function displayHelpBubble(params) {

        currentBubbleParams = params;

        var isInitialized = true;
        var $tt = null;
        var $p = null;
        var $next = null;
        var $previous = null;
        var $close = null;
        if ($('#help-bubble').length === 0) {
            isInitialized = false;
            $('body').prepend(
                $('<div />')
                    .attr('id', 'help-bubble')
                    .append($('<p />'))
                    .append($('<div class="close">&#215;</div>'))
                    .append($('<button class="previous"></button>'))
                    .append($('<button class="next"></button>'))
            );
        }

        $tt = $('#help-bubble');
        $p = $('p', $tt);
        $next = $('.next', $tt);
        $previous = $('.previous', $tt);
        $close = $('.close', $tt);

        currentBubbleParams.$bubble = $tt;

        if(!isInitialized) {
            $next.html('Next');
            $previous.html('Previous');
            $next.click(onNext);
            $previous.click(onPrevious);
            $close.click(onClose);
            isInitialized = true;
        }

        var tooltipHeight = 30;

        $next.show();
        if(currentStep == steps.length - 1) {
            $next.html('Close');
        }

        $previous.show();
        if(currentStep == 0) {
            $previous.hide();
        }

        $p.html(params.text);

        $tt.removeAttr('style');
        $tt.removeAttr('class');
        $tt.addClass('visible');

        layoutBubble();

    }

    function layoutBubble() {

        if(!currentBubbleParams) {
            return;
        }

        var $ib = currentBubbleParams.$bubble;

        if(!$ib.is(':visible')){
           return
        }
        if(!currentBubbleParams.target) {
            if(currentBubbleParams.left !== undefined){
                $ib.css('left', currentBubbleParams.left + 'px');
            }
            if(currentBubbleParams.top !== undefined){
                $ib.css('top', currentBubbleParams.top + 'px');
            }
            if(currentBubbleParams.right !== undefined){
                $ib.css('right', currentBubbleParams.right + 'px');
            }
            if(currentBubbleParams.bottom !== undefined){
                $ib.css('bottom', currentBubbleParams.bottom + 'px');
            }
            return;
        }

        var $target = $(currentBubbleParams.target);
        var targetData = $target.offset();
        targetData['width'] = $target.width();
        targetData['height'] = $target.width();

        var bubbleSize = {
            width: $ib.width(),
            height: $ib.height()
        };
        var bubbleLeft = 0;
        var bubbleTop = 0;
        var arrowPosition = null;

        switch(currentBubbleParams.relation){
            case 'top':
                bubbleLeft = targetData.left + (targetData.width/2) - (bubbleSize.width / 2);
                bubbleTop = targetData.top - bubbleSize.height - 32;
                arrowPosition = 'bottom';
                break;
            case 'bottom':
                bubbleLeft = targetData.left + (targetData.width/2) - (bubbleSize.width / 2);
                bubbleTop = targetData.top + targetData.height + bubbleSize.height + 32;
                arrowPosition = 'top';
                break;
            case 'left':
                bubbleLeft = targetData.left - bubbleSize.width - 32;
                bubbleTop = targetData.top + (targetData.height/2) + (bubbleSize.height / 2);
                arrowPosition = 'right';
                break;
            case 'right':
                bubbleLeft = targetData.left + targetData.width + bubbleSize.width + 32;
                bubbleTop = targetData.top + (targetData.height/2) - (bubbleSize.height / 2);
                arrowPosition = 'left';
                break;
        }

        $ib.css({left: bubbleLeft + 'px', top: bubbleTop + 'px' });
        if(currentBubbleParams.arrow) {
            $ib.addClass('triangle-border ' + arrowPosition);
        }

    }

    function hideHelpBubble() {
        $('#help-bubble').css('display', 'none');
    }


    function step1() {
        var inputNode = appNS.graph.graph.nodes()[0];
        centerOnNode(inputNode, function(){
            displayHelpBubble({left: 100, top: 100, text: helpStrings[0]});
        });
    }
    steps.push(step1);

    function step2() {
        var nodes = appNS.graph.graph.nodes();
        var hiddenNode = null;
        for(var i=0;i<nodes.length;i++) {
            if(nodes[i].type == 'hidden') {
                hiddenNode = nodes[i];
                break;
            }
        }
        centerOnNode(hiddenNode, function(){
            displayHelpBubble({left: 100, top: 100, text: helpStrings[1]});
        });
    }
    steps.push(step2);

    function step3() {
        var nodes = appNS.graph.graph.nodes();
        var outputNode = null;
        for(var i=0;i<nodes.length;i++) {
            if(nodes[i].type == 'output') {
                outputNode = nodes[i];
                break;
            }
        }
        centerOnNode(outputNode, function(){
            displayHelpBubble({left: 100, top: 100, text: helpStrings[2]});
        });
    }
    steps.push(step3);

    function step4(){
        sigma.misc.animation.camera(
            appNS.graph.camera,
            {
                x: 0,
                y: 0,
                ratio: 1
            },
            {duration: appNS.graph.settings('animationsTime') || 300}
        );
        displayHelpBubble( {target:'#controls', relation:'top', arrow: true, text: helpStrings[3]});
    }
    steps.push(step4);


    function step5(){
        sigma.misc.animation.camera(
            appNS.graph.camera,
            {
                x: 0,
                y: 0,
                ratio: 1
            },
            {duration: appNS.graph.settings('animationsTime') || 300}
        );
        displayHelpBubble( {target:'#examples', relation:'left', arrow: true, text: helpStrings[4]});

    }
    steps.push(step5);

    function centerOnNode(node, cb) {
        sigma.misc.animation.camera(
            appNS.graph.camera,
            {
                x: node[appNS.graph.camera.readPrefix + 'x'],
                y: node[appNS.graph.camera.readPrefix + 'y'],
                ratio: 0.1
            },
            {
                duration: appNS.graph.settings('animationsTime') || 300,
                onComplete: cb
            }
        );
    }

    function start() {
        currentStep = -1;
        next();
    }

    function next() {
        if(currentStep >= steps.length){
            //TODO :end help
            return;
        }
        currentStep++;
        (steps[currentStep])();
    }

    function previous() {
        if(currentStep <= 0){
            //TODO :end help
            return;
        }
        currentStep--;
        (steps[currentStep])();

    }

    $(window).resize(function(){
        layoutBubble();
    });

    var helpEngine = {
        next: next,
        previous: previous,
        start: start,
    };
    appNS.helpEngine = helpEngine;
}());