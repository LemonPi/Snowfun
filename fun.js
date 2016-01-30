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
			var a = $('<div class="block combine"><div class="block-innodule"/><div class="block-innodule"/><div class="block-innodule"/>').draggable();
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
			var a = $("<div class='block outvar'><div class='block-innodule'/></div>").draggable();
			a.find(".block-text").text(state.val);
			return a;
		},
	},
};

function makeBlock(name, state) {
	var a = blocks[name].create(state);
	a.css("position", "absolute");
	a.addClass("holder");
	if (state && state.position) {
		a.position({left: state.position.x, right: state.position.y});
	}
	a.find(".block-nodule").draggable({
		drag: function (e, ui) {
			var b = $(this);
			drawNoduleLine(b);
		}
	});
	if (state && state.value) a.find(".block").text(state.value);
	a.uniqueId();
	return a;
}

function drawNoduleLine(b) {
	$("[data-parent=\"" + b.parent().attr("id") + "\"]").remove();
	var l = createLine(b.parent().offset().left + b.parent().width()*0.5, b.parent().offset().top + (0.5*b.parent().height()), b.offset().left, b.offset().top + b.outerHeight()*0.5);
	l.attr("data-parent", b.parent().attr("id"));
}

function checkSolution() {
	
}

$(document).ready(function(e) {
	//$("body").append(makeBlock("for", null));
	$("body").append(makeBlock("var", {value: 42}));
	//$("body").append(makeBlock("for", null));
	$("body").append(makeBlock("combine", null));
	$("body").append(makeBlock("subroutine", null));
});
