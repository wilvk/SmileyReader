var words = 0;
var currentWordCount = 0;
var settingsMode = false;
var readerRunning = false;
var paused = false;
var settings = {};
var wpmTimeout = 0;
var firstLoop = true;
var newLine = false;
var scrollByDistance = 0;
var scrollMiddle = 0;
var pxVariance = 2;
var arbitraryMaxNumberOfWordsOnAPage = 1000000;
var stopReadingTime = 0;

var totalTime = 0;
var timeout = 0;

var startTime = 0;
var endTime = 0;
var startWord = 0;
var endWord =	 0;
var totalWords = 0;
var pauseTime = 0;
var readText = "";
var website = "";
var serialisedSelection = "";

var lineLength = 0;
var spacebarKeyCharCode = 32;
var paper;

var onScreenDisplay = new OnScreenDisplay();

String.prototype.lpad = function(padString, length) 
{
	var str = this;
	while (str.length < length)
	{
		str = padString + str;
	}

	return str;
};

function messageReceived(request, sender, sendResponse) 
{
	if(request.type == "sendAllSettings")
	{
		settings.cpHexReadingBg = request.cpHexReadingBg;
		settings.cpHexReadingFg = request.cpHexReadingFg;
		settings.cpHexNonReadingBg = request.cpHexNonReadingBg;
		settings.cpHexNonReadingFg = request.cpHexNonReadingFg;
		settings.ReadingBold = JSON.parse(request.ReadingBold);
		settings.ReadingUnderline = JSON.parse(request.ReadingUnderline);
		settings.ReadingItalic = JSON.parse(request.ReadingItalic);
		settings.ReadingStrikethrough = JSON.parse(request.ReadingStrikethrough);
		settings.NonReadingBold = JSON.parse(request.NonReadingBold);
		settings.NonReadingUnderline = JSON.parse(request.NonReadingUnderline);
		settings.NonReadingItalic = JSON.parse(request.NonReadingItalic);
		settings.NonReadingStrikethrough = JSON.parse(request.NonReadingStrikethrough);
		settings.WordsPerMinute = parseInt(request.WordsPerMinute);
		settings.WordPause = JSON.parse(request.WordPause);
		settings.PauseSeconds = parseInt(request.PauseSeconds);
		settings.AutoScroll = JSON.parse(request.AutoScroll);
		settings.PauseWords = parseInt(request.PauseWords);
		settings.ShortCutKey = request.ShortCutKey;
		settings.StopAfterWords = JSON.parse(request.StopAfterWords);
		settings.StopAfterWordsCount = parseInt(request.StopAfterWordsCount);
		settings.StopAfterTime = JSON.parse(request.StopAfterTime);
		settings.StopAfterTimeMinutes = parseInt(request.StopAfterTimeMinutes);
		settings.StopAfterTimeSeconds = parseInt(request.StopAfterTimeSeconds);
		settings.OnScreenDisplay = JSON.parse(request.OnScreenDisplay);
		settings.PauseAtStartOfLine = JSON.parse(request.PauseAtStartOfLine);
		settings.PauseAtStartOfLineMilliseconds = parseInt(request.PauseAtStartOfLineMilliseconds);
		settings.GuideArrows = JSON.parse(request.GuideArrows);
		settings.TextHighlight = JSON.parse(request.TextHighlight);
		settings.ImageHighlight = JSON.parse(request.ImageHighlight);
		settings.ExcludeNonReadingText = JSON.parse(request.ExcludeNonReadingText);
		settings.AutoScrollHeight = parseInt(request.AutoScrollHeight);	
		settings.GuideImageName = request.GuideImageName;
		settings.shadedBackground = JSON.parse(request.ShadedBackground);

		afterSettingsLoaded();
	} 
	else if(request.type == "startReader")
	{
		startReading();
	}
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		messageReceived(request, sender, sendResponse);
});

init();

function init() 
{
	setTimeout(getSettings, 1000); // 1 second delay for message pump
	rangy.init();
}

function togglePause() 
{
	if(startTime > 0 && currentWordCount < words)
	{
		paused = !paused;
	}
	
	setNavBarText();
}

function setNavBarText()
{
	var pauseEl = document.getElementById("pauseText");

	if(pauseEl)
	{
		pauseEl.style.color = "blue";

		if(paused)
		{
			pauseEl.innerHTML = "Unpause";
		}
		else
		{
			pauseEl.innerHTML = "Pause";
		}
	}
}

function getSettings() 
{
	chrome.extension.sendRequest({
		type: "requestAllSettings"
	});
}
  
function afterSettingsLoaded() 
{
	settingsMode = document.getElementById("non_reading_text_sample") !== null;
	scrollMiddle = window.innerHeight * (settings.AutoScrollHeight / 100);
	wpmTimeout = 60000 / settings.WordsPerMinute;
	stopReadingTime = (settings.StopAfterTimeMinutes * 60 * 1000) + (settings.StopAfterTimeSeconds * 1000);

	if(settings.OnScreenDisplay && !settingsMode)
	{
		onScreenDisplay.setUpOnScreenDisplay();
	}

	//if(!settings.GuideArrows || settingsMode)
	//{
	//	if(typeof elImage !== 'undefined')
	//	{
	//		elImage.style.visibility = 'hidden';
	//	}
	//}
}

if (window == top) 
{
	window.addEventListener('keyup', doKeyPress, false); 
} 

function doKeyPress(e)
{
	if(settings.ShortCutKey)
	{
		keyPressKey = settings.ShortCutKey.toUpperCase();
		keyPressKeyCharCode = keyPressKey.charCodeAt(0);

		if (e.shiftKey && e.ctrlKey && e.which == keyPressKeyCharCode)
		{
			startReading();
		}

		if(e.keyCode == spacebarKeyCharCode && readerRunning)
		{
			setWindowScroll();
			togglePause();
		}
	}
}

function startReading() 
{
	if(!readerRunning)
	{
		initialiseAndRunIfTextSelected();
	}
	else
	{
		stopReader();
	}
}

function initialiseAndRunIfTextSelected()
{
	var selectedText = getSelectedText();

	if(selectedText)
	{	
		initialiseBlock();
		runGuidedText();
	}
	else
	{
		alert("No text highlighted for reading.");
	}
}

function stopReader()
{
	endWord = currentWordCount;
	currentWordCount = words;
	readerRunning = false;
	recordRead();
	tryRemovePaper();
	alert("Reader stopped.");
}

function getSelectedText() 
{
	var text = "";

	if (typeof window.getSelection != "undefined") 
	{
		text = window.getSelection().toString();
	} 
	else if (typeof document.selection != "undefined" && document.selection.type == "Text") 
	{
		text = document.selection.createRange().text;
	}

	return text;
}

function initialiseBlock() 
{
	getSerialisedSelection();

	readerRunning = true;
	readText = window.getSelection().toString();

	if(!settings.ExcludeNonReadingText)
	{
		makeEditableAndHighlight(settings.cpHexNonReadingBg, settings.cpHexNonReadingFg);
	}

	getNodesAndAddSpans();
	incrementCurrentWordCountToStartOfSpans();
	createLeftArrowImage();	
	createUpArrowImage();
	
	getCurrentElementAndSetGuideArrows();

	if(!settingsMode)
	{
		setWindowScroll();
	}

	initialiseVariablesForNewRead();
}

function getNodesAndAddSpans()
{	
	nodes = getSelectedNodes();	
	
	var spanAppender = new SpanAppender(settings);
	spanAppender.addSpansToTextNodes(nodes);
}

function initialiseVariablesForNewRead()
{
	window.getSelection().removeAllRanges();
	startWord = currentWordCount;
	currentWordCount--;
	firstLoop = true;
	timeout = 0;
	startTime = +new Date();
}

function setWindowScroll()
{
	window.scrollTo(0, parseFloat(document.getElementById("leftArrow").style.top.replace("px", "") - scrollMiddle));
}

function incrementCurrentWordCountToStartOfSpans()
{
	while(getWordElement(currentWordCount) === null && currentWordCount < arbitraryMaxNumberOfWordsOnAPage)
	{
		currentWordCount++;
	}
}

function getSerialisedSelection()
{
	if(!settingsMode)
	{
		serialisedSelection = rangy.serializeSelection();
	}
}

function runGuidedText()
{
	if(settings.TextHighlight)
	{
		runMainLoopTextHighlight();
	}
	else if(settings.ImageHighlight)
	{
		runMainLoopImageHighlight();
	}
}

function createLeftArrowImage()
{
	var imageElement = document.createElement('img');

	imageElement.setAttribute('src', chrome.extension.getURL('images/arrowLeft.png'));
	imageElement.setAttribute('id', 'leftArrow');
	imageElement.style.position = 'absolute';
	imageElement.style.zIndex = 99999;
	document.getElementsByTagName('body')[0].appendChild(imageElement);
}

function createUpArrowImage()
{
	var imageElement = document.createElement('img');
	var relativeImageName = 'images/guideImages/' + settings.GuideImageName;
	
	imageElement.setAttribute('src', chrome.extension.getURL(relativeImageName));
	imageElement.setAttribute('id', 'upArrow');
	imageElement.style.position = 'absolute';
	imageElement.style.zIndex = 99999;

	document.getElementsByTagName('body')[0].appendChild(imageElement);
}

function runMainLoopImageHighlight() 
{
	function mainLoopFunction() 
	{
		currentWordCount++;
		
		getCurrentElementAndSetGuideArrows();

		callNewLineFunctions();

		var canContinueRunning = areWordsAndTimeCorrectToKeepRunning();

		if(canContinueRunning)
		{
			timeout = wpmTimeout;

			setPauseIfAfterPauseWordCount();
			checkAndSetNewLineFunctions();

			totalTime += timeout;
			firstLoop = false;

			moveUpArrow(timeout, lineLength.increment);

			onScreenDisplay.updateOnScreenDisplay();

			function doPause() 
			{
				if(paused)
				{
					pauseTime += 100;
					setTimeout(doPause, 100);
				}
				else
				{
					setTimeout(mainLoopFunction, timeout);
				}
			}
			doPause();
		}
		else
		{
			endReader();
		}
	}
	mainLoopFunction();
}

function callNewLineFunctions()
{
	if(newLine || firstLoop)
	{
		lineLength = getLengthOfCurrentLine();
		setBlackoutShading(lineLength);
		setUpArrowNewLinePosition(lineLength.bottom, lineLength.left);	
	}
}

function setBlackoutShading(lineLength)
{
	if(settings.shadedBackground)
	{
		var docHeight = (document.height !== undefined) ? document.height : document.body.offsetHeight;
		var docWidth = (document.width !== undefined) ? document.width : document.body.offsetWidth;
		var gap = (lineLength.top - lineLength.bottom ) / 2;

		tryRemovePaper();

		paper = Raphael(0, 0, docWidth, docHeight);
		var rectangleOne = paper.rect(0, 0, docWidth, lineLength.top + gap).attr({"fill":"black","opacity":"0.7"});
		var rectangleTwo = paper.rect(0, lineLength.bottom - gap, docWidth, docHeight).attr({"fill":"black","opacity":"0.7"});
	}
}

function tryRemovePaper()
{
	try
	{
		paper.remove();
	}
	catch (error) 
	{
		
	}
}

function getCurrentElementAndSetGuideArrows()
{
	var element = getWordElement(currentWordCount);

	if(element)
	{
		setGuideArrows(element);
	}
}

function setUpArrowNewLinePosition(bottom, left)
{
	var element = document.getElementById("upArrow");
	element.style.top = bottom + 'px';
	element.style.left = left + 'px';
}

function endReader()
{
	endTime = +new Date();
	endWord = currentWordCount;
	currentWordCount = words;
	readerRunning = false;
	recordRead();
	tryRemovePaper();
}

function setAutoScroll()
{
	if(settings.AutoScroll && !settingsMode)
	{
		window.scrollBy(0, scrollByDistance);
	}
}

function setStartOfLinePause()
{
	if(settings.PauseAtStartOfLine)
	{
		timeout += settings.PauseAtStartOfLineMilliseconds;
		pauseTime += settings.PauseAtStartOfLineMilliseconds;
	}
}

function setPauseIfAfterPauseWordCount()
{
	if(settings.WordPause && settings.PauseWords > 0 && settings.PauseSeconds > 0 && currentWordCount > 0 && currentWordCount % settings.PauseWords === 0)
	{
		timeout += (settings.PauseSeconds * 1000);
		pauseTime += (settings.PauseSeconds * 1000);
	}
}

function areWordsAndTimeCorrectToKeepRunning()
{
	if(currentWordCount > words - 1)
	{
		return false;
	}

	if(settings.StopAfterWords && (currentWordCount > settings.StopAfterWordsCount))
	{
		return false;
	}

	if(settings.StopAfterTime && (totalTime > stopReadingTime))
	{
		return false;
	}

	return true;
}

function moveUpArrow(timeout, increment) 
{
	var totalIncrementTimeout = 0;
	var timeoutIncrement = timeout / increment;

	function moveArrowFunction() 
	{
		if(totalIncrementTimeout < timeout)
		{
			incrementUpArrowByOnePx();
			totalIncrementTimeout += timeoutIncrement;					
			setTimeout(moveArrowFunction, timeoutIncrement);
		}
	}
	moveArrowFunction();
}

function incrementUpArrowByOnePx()
{
	var img = document.getElementById("upArrow");
	img.style.left = (parseInt(img.style.left.replace('px', '')) + 1) + 'px';
}

function getLengthOfCurrentLine() 
{
	var startSpan = getWordElement(currentWordCount);
	var tempSpan;
	var left = startSpan.getBoundingClientRect().left + window.scrollX;
	var bottom = startSpan.getBoundingClientRect().bottom + window.scrollY;
	var tempLeft = left;	
	var top = startSpan.getBoundingClientRect().top + window.scrollY;

	var wordsOnCurrentLine = getNumberOfWordsOnCurrentLine(startSpan);

	if(wordsOnCurrentLine === 0)
	{
		wordsOnCurrentLine = words;
		tempSpan = getWordElement(currentWordCount + wordsOnCurrentLine);
	}
	else
	{
		tempSpan = getWordElement(currentWordCount + wordsOnCurrentLine - 1);
	}

	tempSpan = getWordElement(currentWordCount + wordsOnCurrentLine - 1);

	var right = tempSpan.getBoundingClientRect().left + (tempSpan.getBoundingClientRect().width /2) + window.scrollX;
	var length = right - left;
	var increment = length / wordsOnCurrentLine;

	return {left: left, bottom: bottom, top: top, increment: increment, pixelLength:length, noWords: wordsOnCurrentLine};
}

function getNumberOfWordsOnCurrentLine(startSpan)
{
	var bottom = startSpan.getBoundingClientRect().bottom + window.scrollY;
	var endOfLine = 0;

	for(var i = 1; i < words && endOfLine === 0; i++)
	{
		tempSpan = getWordElement(currentWordCount + i);

		if(tempSpan)
		{
			var tempBottom = tempSpan.getBoundingClientRect().bottom + window.scrollY;

			if(Math.floor(tempBottom) > Math.floor(bottom) + pxVariance || Math.floor(tempBottom) < Math.floor(bottom) - pxVariance)
			{
				endOfLine = i;
			}
		}
		else
		{
			endOfLine = i;
		}

	}
	return endOfLine;
}

function runMainLoopTextHighlight()
{
	function mainLoopFunction() 
	{
		if(!firstLoop)
		{
			restoreNonReadingWord();
		}

		currentWordCount++;

		var canContinueRunning = areWordsAndTimeCorrectToKeepRunning();

		if(canContinueRunning)
		{
			var element = getWordElement(currentWordCount);

			if(element)
			{
				setGuideArrows(element);
				setElementReadingColors(element);

				timeout = wpmTimeout;

				setPauseIfAfterPauseWordCount();
				checkAndSetNewLineFunctions();

				totalTime += timeout;

				firstLoop = false;
			}
			else
			{
				timeout = 0;
			}

			onScreenDisplay.updateOnScreenDisplay();

			function doPause() 
			{
				if(paused)
				{
					pauseTime += 100;
					setTimeout(doPause, 100);
				}
				else
				{
					setTimeout(mainLoopFunction, timeout);
				}
			}
			doPause();
		}
		else
		{
			endReader();
		}
	}
	mainLoopFunction();
}

function checkAndSetNewLineFunctions()
{
	if(newLine)
	{
		setStartOfLinePause();
		setAutoScroll();
		newLine=false;
	}
}

function setElementReadingColors(element)
{
	var nonReadingStyle = element.style;
	element.style.background = settings.cpHexReadingBg;		
	element.style.color = settings.cpHexReadingFg;
}

function recordRead() 
{
	var RecordObject = {};
	RecordObject.DTSStart = startTime;
	RecordObject.DTSEnd = endTime;
	RecordObject.WPM = settings.WordsPerMinute;
	RecordObject.StartWord = startWord;
	RecordObject.EndWord = endWord;
	RecordObject.Words = words;
	RecordObject.PauseTime = pauseTime;
	RecordObject.ReadText = readText;
	RecordObject.Website = document.URL;
	RecordObject.SerialisedSelection = serialisedSelection;

	chrome.extension.sendRequest({type: "submitReadEntry", recordObject: RecordObject});
}

function setGuideArrows(elementSpan) 
{
	var yVals = getNewTopOldTop(elementSpan);

	if(Math.floor(yVals.newTop) > Math.floor(yVals.oldTop) + pxVariance || Math.floor(yVals.newTop) < Math.floor(yVals.oldTop) - pxVariance) 
	{
		newLine = true;
		scrollByDistance = yVals.newTop - yVals.oldTop;
	}

	var leftArrowImage = document.getElementById("leftArrow");
	leftArrowImage.style.top = yVals.newTop + "px";	
}

function getNewTopOldTop(elementSpan)
{
	leftArrowImage = document.getElementById("leftArrow");
	var boundingRectangle = elementSpan.getBoundingClientRect();

	var parentSpan = findFirstParagraphOrDiv(elementSpan);
	var parentRect = parentSpan.getBoundingClientRect();

	leftArrowImage.style.left = (parentRect.left + window.scrollX - (leftArrowImage.clientWidth + 2)) + "px"; 

	var oldTop = parseFloat(leftArrowImage.style.top.replace('px', ''));
	var newTop = ( (boundingRectangle.top + boundingRectangle.bottom) / 2) + window.scrollY - (leftArrowImage.clientHeight / 2 );	

	return {newTop : newTop, oldTop : oldTop};
}

function findFirstParagraphOrDiv(element)
{
	var parentSpan = findUpTag(element, "P");

	if(!parentSpan)
	{
		parentSpan = findUpTag(element, "DIV") || element;
	}

	return parentSpan;
}

function findUpTag(element, tag) 
{
	while (element.parentNode) 
	{
		element = element.parentNode;
		
		if(element && element.tagName)
		{
			if (element.tagName.toLowerCase() === tag.toLowerCase())
			{
				return element;
			}
		}
	}

	return null;
}

function restoreNonReadingWord()
{
	var element = getWordElement(currentWordCount);

	if(element)
	{
		nonReadingStyle = element.style;
		element.style.background = settings.cpHexNonReadingBg;
		element.style.color = settings.cpHexNonReadingFg;
	}
}

function getWordElement(word)
{
	var padSpanWord = getPadSpanWord(word);
	var element = document.getElementById(padSpanWord);

	return element;
}

function getPadSpanWord(word)
{
	var wordString = word.toString();
	var padSpanWord = "sel" + wordString.lpad("0", 6);

	return padSpanWord;
}

function makeEditableAndHighlight(backColor, foreColor) 
{
	var style = document.createElement('style');
	style.type = 'text/css';
	style.innerHTML = '*.highlightStyle { color: ' + foreColor + '; background-color: ' + backColor + ';}';
	document.getElementsByTagName('head')[0].appendChild(style);
	highlightApplier = rangy.createCssClassApplier("highlightStyle");
	highlightApplier.toggleSelection();	
}

function getSelectedNodes() 
{
	rangy.createMissingNativeApi();
	var selectedNodes = [];
	var sel = rangy.getSelection();
	
	for (var i = 0; i < sel.rangeCount; ++i) 
	{
		selectedNodes = selectedNodes.concat( sel.getRangeAt(i).getNodes() );
	}

	return selectedNodes;
}