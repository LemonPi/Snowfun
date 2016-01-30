"use strict";
const DIALOGUE = 1;
const INGAME = 0;
var state = DIALOGUE;
var currentScenes = [];
var currentSceneIndex = 0;
var currentTextIndex = 0;
var curLevel = null;
var endSceneCallback = null;
function advanceDialogue() {
	if (advanceText()) return;
	advanceScene();
}

var combinations = {
	"frames:lenses":"sunglasses",
	"rocks:snow":"malformed coats",
	"nice rocks:snow":"snowcoats",
	"sun:snow":"water",
	"water:carrot_seeds":"carrots",
	"snow:carrot_seeds":"cold carrot seeds",
	"snowman_core:snowman_body":"snowman",
	"snow:snowcoats":"snowman body without nose",
	"snowman body without nose:carrots":"snowman_body"
}

var imgType = ".png";
var imgFolder = "img/";

function advanceScene() {
	var newsceneind = ++currentSceneIndex;
	if (newsceneind >= currentScenes.length) {
		endScene();
		return;
	}
	var newScene = currentScenes[newsceneind];
	$(".scene-speaker").attr("src", imgFolder + newScene.speaker + ".png").attr("alt", imgFolder + newScene.speaker + ".png");
	if (newScene.position === "left") {
		$(".scene-speaker").addClass("left");
		$(".scene-speaker").removeClass("right");
	}
	else {
		$(".scene-speaker").removeClass("left");
		$(".scene-speaker").addClass("right");		
	}
	currentTextIndex = -1;
	advanceText();
}

function advanceText() {
	++currentTextIndex;
	if (currentTextIndex >= currentScenes[currentSceneIndex].text.length) {
		return false;
	}
	$(".scene-text").text(currentScenes[currentSceneIndex].text[currentTextIndex]);
	return true;
}

function endScene() {
	state = INGAME;
	$(".scene-stage").hide();
	if (endSceneCallback) endSceneCallback();
}

function startScene(sceneName) {
	$(".scene-stage").show();
	state = DIALOGUE;
	currentScenes = curLevel[sceneName];
	currentSceneIndex = -1;
	currentTextIndex = -1;
	advanceScene();
}

function mouseDownHandler(e) {
	if (state != DIALOGUE) return;
	advanceDialogue();
}
function loadLevel(levelIndex) {
	$.get("levels/level_" + levelIndex + ".json", null, initLevel, "text");
}

function initUi() {
	$(document).on("mousedown", mouseDownHandler);
	loadLevel(1);
}

function initLevel(json) {
	console.log(initLevel);
	curLevel = JSON.parse(json);
	startScene("scenesbefore");
}

$(document).ready(initUi);