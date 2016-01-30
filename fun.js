"use strict";

/* Third party code */

/* CSS line drawing: http://www.monkeyandcrow.com/blog/drawing_lines_with_css3/ */

function createLine(x1,y1, x2,y2) {
    var length = Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
  var angle  = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  var transform = 'rotate('+angle+'deg)';

    var line = $('<div>')
        .appendTo('body')
        .addClass('line')
        .css({
          'position': 'absolute',
          'transform': transform
        })
        .width(length)
        .offset({left: Math.min(x1, x2), top: Math.min(y1, y2)});

    return line;
}

/* http://upshots.org/javascript/jquery-hittestobject */

$.fn.hitTestObject = function(selector){
		console.log("hit test: ", this, selector);
        var compares = $(selector);
        var l = this.size();
        var m = compares.size();
        for(var i = 0; i < l; i++){
           var bounds = this.get(i).getBoundingClientRect();
            for(var j = 0; j < m; j++){
               var compare = compares.get(j).getBoundingClientRect();
               if(!(bounds.right < compare.left ||
                    bounds.left > compare.right ||
                    bounds.bottom < compare.top ||
                    bounds.top > compare.bottom)){
						return true;   
                }
            }
        }
		return false;
	};

/* end third-party code */

var blocks = {
	"for": {
		create: function(state) {
			var a = $("<div class='block-statement block for'><div class='block-header'>for <div class='block-for-count'/></div><div class='block-for-inner'></div></div>");
			a.draggable({handle: a.find(".block-header")});
			a.find(".block-for-inner").droppable({
				accept: ".block-statement",
				drop: function (event, ui){
					ui.draggable.remove().css("position", "").appendTo(this);
				}
			});
			a.find(".block-for-count").droppable({
				accept: ".block var",
				drop: function (event, ui){
					blocks["var"].create(blocks["var"].tostate(ui.draggable)).appendTo(this).draggable({handle: ui.draggable.find(".block-header")});
					ui.draggable.remove();
				}
			});
			return a;
		}
	},
	"var": {
		create: function(state) {
			var a = $("<div><a class='block var'/><a class='block-nodule blockafter varafter'/></div>").draggable({
				drag: function(ev, ui) {
					drawNoduleLine($(this).find(".block-nodule"));
				}
			});
			return a;
		},
		tostate: function(div) {
			return {val: div.text()};
		}
	},
	"combine": {
		create: function(state) {
			var a = $('<div><a class="block combine">Combine</a><a class="block-nodule blockafter combineafter"/></div>').draggable();
			return a;
		}
	},
	"subroutine": {
		create: function(state) {
			var a = $('<div class="block subroutine"><div class="block-innodule"/><div class="block-nodule"/></div>').draggable();
			return a;
		}
	},
	"outvar": {
		create: function(state) {
			var a = $("<div><a class='block outvar'/></div>").draggable();
			a.find(".block-text").text(state.val);
			return a;
		},
	},
};

var blockContainer;

function makeBlock(name, state) {
	var a = blocks[name].create(state);
	a.css("position", "absolute");
	a.addClass("holder");
	a.attr("data-blocktype", name);
	a.find(".block-nodule").draggable({
		drag: function (e, ui) {
			var b = $(this);
			drawNoduleLine(b);
		}
	});
	if (state && state.value) a.find(".block").text(state.value);
	if (state && state.hint) a.attr("data-hint", JSON.stringify(state.hint));
	a.uniqueId();
	return a;
}

function drawNoduleLine(b) {
	$("[data-parent=\"" + b.parent().attr("id") + "\"]").remove();
	var l = createLine(b.parent().offset().left + b.parent().width()*0.5, b.parent().offset().top + (0.5*b.parent().height()), b.offset().left, b.offset().top + b.outerHeight()*0.5);
	l.attr("data-parent", b.parent().attr("id"));
}

function checkSolution() {
	var terminating = $(".outvar").parent();
	var a = getVal($(".nodules"), terminating, []);
	console.log(a);
	var passed = a == terminating.find(".block").text();
	setPassed(passed);
}

function setPassed(passed) {
	//$(".passed").text(passed? "Yay!", "");
	console.log(passed);
}

function getVal(nodules, startNode, already) {
	if (already.indexOf(startNode) != -1) {
		return "FAIL-loop";
	}
	already.push(startNode);
	var nodeType = startNode.attr("data-blocktype");
	console.log(nodules, startNode, already, nodeType);
	if (nodeType == "var" || nodeType == "subroutine") {
		return startNode.find("block").text();
	}
	var intersects = [];
	// find all nodules on this node
	for (var i = 0; i < nodules.length; i++) {
		if ($(nodules[i]).hitTestObject(startNode)) {
			// find the nodule's parent
			var parent = $(nodules[i]).parent();
			if (parent.attr("id") == startNode.attr("id")) continue;
			intersects.push(parent);
		}
	}
	console.log(intersects);
	if (nodeType == "combine") {
		if (intersects.length != 2) return "FAIL";
		var first = getVal(nodules, intersects[0], already);
		var second = getVal(nodules, intersects[1], already);
		var combo = combinations[first + ":" + second];
		if (combo) return combo;
		combo = combinations[second + ":" + first];
		if (combo) return combo;
		return "FAIL-combine";
	}
	if (nodeType == "outvar") {
		if (intersects.length != 1) return "FAIL-outvar";
		return getVal(nodules, intersects[0], already);
	}
	return "FAIL-unknown";
}

function createBlocks() {
	blockContainer.empty();
	for (var i = 0; i < curLevel.init.length; i++) {
		var a = makeBlock(curLevel.init[i].block.type, curLevel.init[i].block);
		blockContainer.append(a);
		a.css("left", curLevel.init[i].position.x*30 + "px").css("top", curLevel.init[i].position.y*30 + "px");
	}

	for (var i = 0; i < curLevel.draggables.length; i++) {
		var dragged = makeBlock(curLevel.draggables[i].type, curLevel.draggables[i]);
		dragged.css("right", "0px")
		blockContainer.append(dragged);
	}
}

$(document).ready(function(e) {
	blockContainer = $(".block-container");
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