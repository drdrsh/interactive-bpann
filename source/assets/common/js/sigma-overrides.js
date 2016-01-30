/**
* This label renderer will just display the label on the right of the node.
*
* @param  {object}                   node     The node object.
* @param  {CanvasRenderingContext2D} context  The canvas context.
* @param  {configurable}             settings The settings function.
*/
sigma.canvas.labels.def = function(node, context, settings) {
    var fontSize,
        prefix = settings('prefix') || '',
        size = node[prefix + 'size'];

    if (size < settings('labelThreshold'))
      return;

    if (!node.label || typeof node.label !== 'string')
      return;

    fontSize = (settings('labelSize') === 'fixed') ?
      settings('defaultLabelSize') :
      settings('labelSizeRatio') * size;

    context.font = (settings('fontStyle') ? settings('fontStyle') + ' ' : '') +
      fontSize + 'px ' + settings('font');
    context.fillStyle = (settings('labelColor') === 'node') ?
      (node.color || settings('defaultNodeColor')) :
      settings('defaultLabelColor');

    context.fillText(
      node.label,
      Math.round(node[prefix + 'x'] - fontSize * 2 ),
      Math.round(node[prefix + 'y'] - size - 3 )
    );
    if(node.sublabel) {
        context.fillText(
          node.sublabel,
          Math.round(node[prefix + 'x'] - fontSize * 2 ),
          Math.round(node[prefix + 'y'] + size + 15 )
        );
    }

    if(node.sidelabel) {
        context.fillText(
            node.sidelabel,
            Math.round(node[prefix + 'x'] + fontSize * 3 ),
            Math.round(node[prefix + 'y'] + size - 15 )
        );
    }
};


sigma.canvas.edges.labels.def = function(edge, source, target, context, settings) {
    if (typeof edge.label !== 'string' || source == target)
        return;

    var prefix = settings('prefix') || '',
        size = edge[prefix + 'size'] || 1;

    if (size < settings('edgeLabelThreshold'))
        return;

    if (0 === settings('edgeLabelSizePowRatio'))
        throw '"edgeLabelSizePowRatio" must not be 0.';

    var fontSize,
        x = (source[prefix + 'x'] + target[prefix + 'x']) / 2,
        y = (source[prefix + 'y'] + target[prefix + 'y']) / 2,
        dX = target[prefix + 'x'] - source[prefix + 'x'],
        dY = target[prefix + 'y'] - source[prefix + 'y'],
        sign = (source[prefix + 'x'] < target[prefix + 'x']) ? 1 : -1,
        angle = Math.atan2(dY * sign, dX * sign);

    // The font size is sublineraly proportional to the edge size, in order to
    // avoid very large labels on screen.
    // This is achieved by f(x) = x * x^(-1/ a), where 'x' is the size and 'a'
    // is the edgeLabelSizePowRatio. Notice that f(1) = 1.
    // The final form is:
    // f'(x) = b * x * x^(-1 / a), thus f'(1) = b. Application:
    // fontSize = defaultEdgeLabelSize if edgeLabelSizePowRatio = 1
    fontSize = (settings('edgeLabelSize') === 'fixed') ?
        settings('defaultEdgeLabelSize') :
    settings('defaultEdgeLabelSize') *
    size *
    Math.pow(size, -1 / settings('edgeLabelSizePowRatio'));

    context.save();

    if (edge.active) {
        context.font = [
            settings('activeFontStyle'),
            fontSize + 'px',
            settings('activeFont') || settings('font')
        ].join(' ');

        context.fillStyle =
            settings('edgeActiveColor') === 'edge' ?
                (edge.active_color || settings('defaultEdgeActiveColor')) :
                settings('defaultEdgeLabelActiveColor');
    }
    else {
        context.font = [
            settings('fontStyle'),
            fontSize + 'px',
            settings('font')
        ].join(' ');

        context.fillStyle =
            (settings('edgeLabelColor') === 'edge') ?
                (edge.color || settings('defaultEdgeColor')) :
                settings('defaultEdgeLabelColor');
    }

    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';

    context.translate(x, y);
    context.rotate(angle);
    context.fillText(
        edge.label,
        -40,
        (-size / 2) - 3
    );

    context.restore();
};


sigma.misc.drawHovers = function() {}