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

function advanceScene() {
	var newsceneind = ++currentSceneIndex;
	if (newsceneind >= currentScenes.length) {
		endScene();
		return;
	}
	var newScene = currentScenes[newsceneind];
	$(".scene-speaker").attr("src", newScene.speaker).attr("alt", newScene.speaker);
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