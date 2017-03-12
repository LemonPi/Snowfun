'use strict';

/* Third party code */

/* http://upshots.org/javascript/jquery-hittestobject */

$.fn.hitTestObject = function(selector) {
    var compares = $(selector);
    var l        = this.size();
    var m        = compares.size();
    for (var i = 0; i < l; i++) {
        var bounds = this.get(i).getBoundingClientRect();
        for (var j = 0; j < m; j++) {
            var compare = compares.get(j).getBoundingClientRect();
            if (!(bounds.right < compare.left || bounds.left > compare.right ||
                  bounds.bottom < compare.top || bounds.top > compare.bottom)) {
                return true;
            }
        }
    }
    return false;
};

/* end third-party code */

var blocks = {
    'var': {
        create: function(state) {
            var a =
                $('<div><a class=\'block var\'/><a class=\'block-nodule blockafter varafter\'/></div>')
                    .draggable({
                        drag: function(ev, ui) {
                            drawNoduleLine($(this).find('.block-nodule'));
                        }
                    });
            return a;
        },
        tostate: function(div) {
            return {val: div.text()};
        }
    },
    'combine': {
        create: function(state) {
            var a =
                $('<div><a class="block combine">Combine</a><a class="block-nodule blockafter combineafter"/></div>')
                    .draggable();
            return a;
        }
    },
    'subroutine': {
        create: function(state) {
            var a =
                $('<div class="block subroutine"><div class="block-innodule"/><div class="block-nodule"/></div>')
                    .draggable();
            return a;
        }
    },
    'outvar': {
        create: function(state) {
            var a = $('<div><a class=\'block outvar\'/></div>');
            a.find('.block-text').text(state.val);
            return a;
        },
    },
    'if': {
        create: function(state) {
            var a =
                $('<div><a class=\'block if\'/><a class=\'block-nodule blockafter varafter\'/></div>')
                    .draggable({
                        drag: function(ev, ui) {
                            drawNoduleLine($(this).find('.block-nodule'));
                        }
                    });
            return a;
        }
    },
    'for': {
        create: function(state) {
            var a =
                $('<div><a class=\'block for\'/><a class=\'block-nodule blockafter varafter\'/></div>')
                    .draggable({
                        drag: function(ev, ui) {
                            drawNoduleLine($(this).find('.block-nodule'));
                        }
                    });
            return a;
        }
    },
};

var blockContainer;
var lineOverlay;
var noduleRadius;

var curText   = null;
var hintPopup = false;

$(document).on('mousedown', function() {
    console.log('hint popup: ' + hintPopup);
    if (hintPopup) {
        if (curText && curText.length > 0) {
            rightDialog.text(curText.shift());
        } else {
            rightDialog.hide();
            hintPopup = false;
        }
    }
});

function makeBlock(name, state) {
    var a = blocks[name].create(state);
    a.css('position', 'absolute');
    a.addClass('holder');
    a.attr('data-blocktype', name);
    a.find('.block-nodule').draggable({
        drag: function(e, ui) {
            var b = $(this);
            drawNoduleLine(b);
        }
    });
    a.click(function() {
        curText = state.hint;
        rightDialog.text(curText.shift());
        rightDialog.show();
        hintPopup = true;

        // alert(state.hint);
    });
    if (state && state.output) {
        a.find('.block').text('If: ' + state.output);
        a.attr('data-output', state.output);
    } else if (state && state.value)
        a.find('.block').text(state.value);
    if (state && state.hint)
        a.attr('data-hint', JSON.stringify(state.hint));
    if (state && state.input)
        a.attr('data-input', state.input);
    a.uniqueId();
    return a;
}

function drawNoduleLine(b) {
    if (!noduleRadius) {
        var nodule = $('.block-nodule');
        if (nodule.length) {
            noduleRadius = $(nodule[0]).outerWidth() / 2;
        }
    }
    console.log(noduleRadius);

    var l = createLine(
        b.parent().offset().left, b.parent().offset().top + (0.5 * b.parent().height()) - 4,
        b.offset().left + noduleRadius - 6, b.offset().top + noduleRadius - 4,
        b.parent().attr('id') + '-line');
}

function checkSolution() {
    var terminating = $('.outvar').parent();
    var a           = getVal($('.block-nodule'), terminating, []);
    console.log(a);
    var passed = a == terminating.find('.block').text();
    setPassed(passed);
}

function setPassed(passed) {
    if (passed) {
        leftDialog.show(100);
        leftDialog.html(
            '<p>You did it!</p><button class=\'block small\' onClick=\'passedLevel()\'>Continue to next level</button>');
    }
}

function getVal(nodules, startNode, already) {
    if (already.indexOf(startNode) != -1) {
        return 'FAIL-loop';
    }
    already.push(startNode);
    var nodeType = startNode.attr('data-blocktype');
    if (nodeType == 'var' || nodeType == 'subroutine') {
        return startNode.find('.block').text();
    }
    var intersects = [];
    // find all nodules on this node
    for (var i = 0; i < nodules.length; i++) {
        if ($(nodules[i]).hitTestObject(startNode)) {
            // find the nodule's parent
            var parent = $(nodules[i]).parent();
            if (parent.attr('id') == startNode.attr('id'))
                continue;
            intersects.push(parent);
        }
    }
    // console.log(intersects);
    if (nodeType == 'combine') {
        if (intersects.length != 2)
            return 'FAIL-combine-length';
        var first  = getVal(nodules, intersects[0], already);
        var second = getVal(nodules, intersects[1], already);
        var combo  = combinations[first + ':' + second];
        if (combo)
            return combo;
        combo = combinations[second + ':' + first];
        if (combo)
            return combo;
        return 'FAIL-combine';
    }
    if (nodeType == 'outvar') {
        if (intersects.length != 1)
            return 'FAIL-outvar';
        return getVal(nodules, intersects[0], already);
    }
    if (nodeType == 'if') {
        if (intersects.length != 1)
            return 'FAIL-if';
        var first = getVal(nodules, intersects[0], already);
        if (first != startNode.attr('data-input'))
            return 'FAIL-if-val';
        return startNode.attr('data-output');
    }
    if (nodeType == 'for') {
        if (intersects.length != 2)
            return 'FAIL-for';
        var first  = getVal(nodules, intersects[0], already);
        var second = getVal(nodules, intersects[1], already);
        if (first == 'water' && second == 'carrot_seeds')
            return 'carrots';
        if (first == 'carrot_seeds' && second == 'water')
            return 'carrots';
        return 'FAIL';
    }
    return 'FAIL-unknown';
}

function createBlocks() {
    blockContainer.empty();
    for (var i = 0; i < curLevel.init.length; i++) {
        var a = makeBlock(curLevel.init[i].block.type, curLevel.init[i].block);
        blockContainer.append(a);
        a.css('left', curLevel.init[i].position.x * 30 + 'px')
            .css('top', curLevel.init[i].position.y * 30 + 'px');
    }

    for (var i = 0; i < curLevel.draggables.length; i++) {
        var dragged = makeBlock(curLevel.draggables[i].type, curLevel.draggables[i]);
        dragged.css('right', '0px').css('top', i * 50 + 'px');
        blockContainer.append(dragged);
    }
}

function createLine(x1, y1, x2, y2, existingLineID) {
    // draw manhattan lines

    x1 = Math.round(x1);
    x2 = Math.round(x2);
    y1 = Math.round(y1);
    y2 = Math.round(y2);


    var line = $('#' + existingLineID);
    if (line.length) {
        line.attr('points', [x1, ',', y1, ' ', x2, ',', y1, ' ', x2, ',', y2].join(''));
    } else {
        line = $(document.createElementNS('http://www.w3.org/2000/svg', 'polyline'))
                   .appendTo(lineOverlay)
                   .attr('class', 'line')
                   .attr('id', existingLineID)
                   .attr('stroke-dasharray', '10,10')
                   .attr('points', [x1, ',', y1, ' ', x2, ',', y1, ' ', x2, ',', y2].join(''));
    }

    return line;
}

$(document).ready(function(e) {
    blockContainer = $('.block-container');
    lineOverlay    = $('#lineoverlay');
});

$(document).on('mousemove', function(e) {
    if (e.which == 0)
        return;
    checkSolution();
});

/*
$(document).ready(function(e) {
    //$("body").append(makeBlock("for", null));
    $("body").append(makeBlock("var", {value: 42}));
    //$("body").append(makeBlock("for", null));
    $("body").append(makeBlock("combine", null));
    $("body").append(makeBlock("subroutine", null));
});
*/