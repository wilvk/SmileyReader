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
var iDiv;
var paper;

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

function setUpOnScreenDisplay() 
{
	var style = document.createElement('style');
	style.type = 'text/css';

	style.innerHTML = '#navbar.navbar_absolute {position:absolute; font-family: Helvetica, sans-serif; z-index: 1000; font-size: 12px; top:5px; width:200px; right:5px; height:50px; border:2px solid; padding:15px; border-radius:25px; float:left; align:left;\
	background: -webkit-linear-gradient(top, #ffffff 0%,#e5e5e5 100%); }\
	#navbar.navbar_fixed { position:fixed; font-family: Helvetica, sans-serif; z-index: 1000; font-size: 12px; top:5px; width:200px; right:5px; height:50px; border:2px solid; padding:15px; border-radius:25px; float:left; align:left;\
	background: -webkit-linear-gradient(top, #ffffff 0%,#e5e5e5 100%);}';

	document.getElementsByTagName('head')[0].appendChild(style);

	document.addEventListener('DOMContentLoaded', function() { 
		window.addEventListener("scroll", navBarResetTop, false);
	});

	iDiv = document.createElement('div');
	iDiv.id = 'navbar';
	iDiv.className = 'navbar_fixed';
	document.getElementsByTagName('body')[0].appendChild(iDiv);

	iDiv.innerHTML = 'Words Per Minute: <span id=\'words_per_minute\'></span></br>Words Read: <span id=\'words_read\'></span></br>Time Elapsed: <span id=\'time_elapsed\'></span>';

	appendCloseIconToOnScreenDisplay();
	appendPauseTextToOnScreenDisplay();
}

function appendCloseIconToOnScreenDisplay()
{
	var elImage = document.createElement('img');
	elImage.setAttribute('src', chrome.extension.getURL('images/cross.png'));
	elImage.setAttribute('id', 'crossImage');
	elImage.style.position = 'absolute';
	elImage.style.top = "15px";
	elImage.style.right = "20px";
	elImage.style.cursor = "pointer";
	elImage.onclick = closeOnScreenDisplay;
	iDiv.appendChild(elImage);	
}

function appendPauseTextToOnScreenDisplay()
{
	var pauseEl = document.createElement("div");
	pauseEl.id = "pauseText";
	pauseEl.innerHTML = "Pause";
	pauseEl.style.top = "20x";
	pauseEl.style.right = "25px";
	pauseEl.style.color = "blue";
	pauseEl.style.position = 'absolute';
	pauseEl.style.cursor = "pointer";
	pauseEl.onclick = togglePause;
	iDiv.appendChild(pauseEl);
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

function closeOnScreenDisplay() 
{
	iDiv.style.visibility = 'hidden';	
}

function navBarResetTop() 
{
	var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;

	if(scrollTop > navbar_top && navbar.className === "navbar_absolute") 
	{
		document.getElementById("navbar").className = "navbar_fixed";
	}
	else if(scrollTop < navbar_top && navbar.className === "navbar_fixed") 
	{
		document.getElementById("navbar").className = "navbar_absolute";
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
		setUpOnScreenDisplay();
	}

	if(!settings.GuideArrows || settingsMode)
	{
		if(typeof elImage !== 'undefined')
		{
			elImage.style.visibility = 'hidden';
		}
	}
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
		alert("No text Highlighted for reading.");
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
	startOffset = window.getSelection().getRangeAt(0).startOffset;
	endOffset = window.getSelection().getRangeAt(0).endOffset;	
	
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

			updateOnScreenDisplay();

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

function updateOnScreenDisplay() 
{
	if(settings.OnScreenDisplay && !settingsMode)
	{
		var wordsRead = document.getElementById("words_read");
		var wpm = document.getElementById("words_per_minute");
		var timeElapsed = document.getElementById("time_elapsed");
		var endElapsed = new Date().getTime();
		var elapsed = endElapsed - startTime;

		var hours = Math.floor(elapsed / 36e5),	mins = Math.floor((elapsed % 36e5) / 6e4), secs = Math.floor((elapsed % 6e4) / 1000); 

		wordsRead.innerHTML = currentWordCount;
		wpm.innerHTML = settings.WordsPerMinute;
		timeElapsed.innerHTML = String(hours).lpad("0", 2) + ':' + String(mins).lpad("0", 2) + ':' + String(secs).lpad("0", 2);
	}
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

			updateOnScreenDisplay();

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

function setGuideArrows(elSpan) 
{
	var yVals = getNewTopOldTop(elSpan);

	if(Math.floor(yVals.newTop) > Math.floor(yVals.oldTop) + pxVariance || Math.floor(yVals.newTop) < Math.floor(yVals.oldTop) - pxVariance) 
	{
		newLine = true;
		scrollByDistance = yVals.newTop - yVals.oldTop;
	}

	elImage.style.top = yVals.newTop + "px";	
}

function getNewTopOldTop(elSpan)
{
	elImage = document.getElementById("leftArrow");
	var rect = elSpan.getBoundingClientRect();

	var parentSpan = findFirstParagraphOrDiv(elSpan);
	var parentRect = parentSpan.getBoundingClientRect();

	elImage.style.left = (parentRect.left + window.scrollX - (elImage.clientWidth + 2)) + "px"; 

	var oldTop = parseFloat(elImage.style.top.replace('px', ''));
	var newTop = ( (rect.top + rect.bottom) / 2) + window.scrollY - (elImage.clientHeight / 2 );	

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

function checkArrayForValidText(textArray)
{
	var valid = false;

	for(var i = 0; i < textArray.length; i++)
	{
		if(textArray[i].length > 0)
		{
			valid = true;
		}
	}

	return valid;
}

function isTextValidToAppendTo(text)
{
	if(text.indexOf("\r") == -1 && text.indexOf("\n") == -1 && text.length > 0)
	{
		return true;
	}
	else
	{
		return false;
	}
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