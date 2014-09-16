var words=0;
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
var pxVariance = 6;
var arbitraryMaxNumberOfWordsOnAPage = 1000000;
var stopReadingTime = 0;

//loop variables
var totalTime = 0;
var timeout = 0;

// indexdb recorded fields
var startTime = 0;
var endTime = 0;
var startWord = 0;
var endWord =	 0;
var totalWords = 0;
var pauseTime = 0;
var readText = "";
var website = "";
var serialisedSelection = "";

// imageVariables
var lineLength = 0;

var spacebarKeyCharCode = 32;

//div
var iDiv;

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

	var elImage = document.createElement('img');
	elImage.setAttribute('src', chrome.extension.getURL('images/cross.png'));
	elImage.setAttribute('id', 'crossImage');
	elImage.style.position = 'absolute';
	elImage.style.top = "15px";
	elImage.style.right = "20px";
	elImage.onclick = closeOnScreenDisplay;
	iDiv.appendChild(elImage);	

	var pauseEl = document.createElement("div");
	pauseEl.id = "pauseText";
	pauseEl.innerHTML = "Pause";
	pauseEl.style.top = "20x";
	pauseEl.style.right = "25px";
	pauseEl.style.color = "blue";
	pauseEl.style.position = 'absolute';
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
	var selectedText = getSelectedText();

	if(!readerRunning)
	{
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
	else
	{
		stopReader();
	}
}

function stopReader()
{
	endWord = currentWordCount;
	currentWordCount = words;
	readerRunning=false;
	recordRead();
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
	var nodes;
	var startOffset;
	var endOffset;

	getSerialisedSelection();

	readerRunning = true;
	readText = window.getSelection().toString();

	if(!settings.ExcludeNonReadingText)
	{
		makeEditableAndHighlight(settings.cpHexNonReadingBg, settings.cpHexNonReadingFg);
	}

	nodes = getSelectedNodes();	
	startOffset = window.getSelection().getRangeAt(0).startOffset;
	endOffset = window.getSelection().getRangeAt(0).endOffset;	

	addSpansToTextNodes(nodes, startOffset, endOffset);

	incrementCurrentWordCountToStartOfSpans();
	createLeftArrowImage();	
	createUpArrowImage();
	
	var element = getWordElement(currentWordCount);
	setGuideArrows(element);

	if(!settingsMode)
	{
		setWindowScroll();
	}

	initialiseVariablesForNewRead();
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
	document.getElementsByTagName('body')[0].appendChild(imageElement);
}

function createUpArrowImage()
{
	var imageElement = document.createElement('img');
	var relativeImageName = 'images/guideImages/' + settings.GuideImageName;
	
	imageElement.setAttribute('src', chrome.extension.getURL(relativeImageName));
	imageElement.setAttribute('id', 'upArrow');
	imageElement.style.position = 'absolute';

	document.getElementsByTagName('body')[0].appendChild(imageElement);
}

function runMainLoopImageHighlight() 
{
	function mainLoopFunction() 
	{
		currentWordCount++;
		var element = getWordElement(currentWordCount);

		if(element)
		{
			setGuideArrows(element);
		}

		if(newLine || firstLoop)
		{
			lineLength = getLengthOfCurrentLine();
		}

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

function endReader()
{
	endTime = +new Date();
	endWord = currentWordCount;
	currentWordCount = words;
	readerRunning = false;
	recordRead();
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

		var hours = Math.floor(elapsed / 36e5),
			mins = Math.floor((elapsed % 36e5) / 6e4),
			secs = Math.floor((elapsed % 6e4) / 1000); 

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

	document.getElementById("upArrow").style.top = (bottom + 'px');
	document.getElementById("upArrow").style.left = (left + 'px');	

	return {left: left, increment: increment, pixelLength:length, noWords: wordsOnCurrentLine};
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

function getTopBottomOfCurrentLine(startSpan)
{
	var endOfLine = 0;
	var top = window.screen.height;
	var bottom = tempSpan.getBoundingClientRect().bottom + window.scrollY;

	for(var i = 1; i < words && endOfLine === 0; i++)
	{
		tempSpan = getWordElement(currentWordCount + i);

		if(tempSpan)
		{
			var tempBottom = tempSpan.getBoundingClientRect().bottom + window.scrollY;
			var tempTop = tempSpan.getBoundingClientRect().top + window.scrollY;

			if(tempTop < top)
			{
				top = tempTop;
			}

			if(tempBottom > bottom)
			{
				bottom = tempBottom;
			}

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

	return {top: top, bottom : bottom };
}

function runMainLoopTextHighlight()
{
	function f() 
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
					setTimeout(f, timeout);
				}
			}
			doPause();
		}
		else
		{
			endReader();
		}
	}
	setTimeout(f, 1500); //delay to allow time to scroll for start for large chunks of text
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

	chrome.extension.sendRequest({
		type: "submitReadEntry", 
		recordObject: RecordObject
	});
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

function findUpTag(el, tag) 
{
	while (el.parentNode) 
	{
		el = el.parentNode;
		
		if(el && el.tagName)
		{
			if (el.tagName.toLowerCase() === tag.toLowerCase())
			{
				return el;
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

function addSpansToTextNodes(nodes, fromOffset, toOffset)
{
	var firstBlockOfText = true;

	for(var i=0; i< nodes.length;i++)
	{
		var text = nodes[i].nodeValue;
		var endText = "";
		var textNode = nodes[i];
		var parentSpan = document.createElement('span');

		var p = nodes[i].parentNode;

		var spansCanBeAdded = canSpansBeAddedToCurrentNode(nodes[i]);

		if(spansCanBeAdded)
		{			
			var textArray = createCleanArrayFromText(text);		

			for(var j=0; j< textArray.length;j++)
			{
				appendSpans(parentSpan, textArray, j);
			}

			if(endText.length > 0)
			{
				parentSpan.appendChild(document.createTextNode(endText));
				endText = "";
			}

			p.insertBefore(parentSpan, nodes[i]);
			nodes[i].parentNode.removeChild(nodes[i]);						
		}
	}
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

function appendSpans(parentSpan, textArray, arrayItem)
{
	var canAppendSpan = isTextValidToAppendTo(textArray[arrayItem]);

	if(canAppendSpan)
	{
		appendSpanToText(textArray, arrayItem, parentSpan);					
	}
	else if(textArray[arrayItem].length === 0 || arrayItem != textArray.length - 1)
	{
		parentSpan.appendChild(document.createTextNode('\n '));	
	}
	else 
	{
		parentSpan.appendChild(document.createTextNode(textArray[arrayItem]));				
	}
}

function appendSpanToText(textArray, currentTextArrayItem, parentSpan)
{
	var span = document.createElement('span');
	span.id = getPadSpanWord(words++);
	span.appendChild(document.createTextNode(textArray[currentTextArrayItem]));

	// adding space to span for imageHighlight to get correct length
	if(settings.ImageHighlight)
	{
		if(textArray.length > 1 && currentTextArrayItem < textArray.length - 1)
		{
			span.appendChild(document.createTextNode(' ')); // add space inside span
		}
	}

	parentSpan.appendChild(span);

	// adding space after span for textHighlight to get exact word
	if(settings.TextHighlight)
	{
		if(textArray.length > 1 && currentTextArrayItem < textArray.length - 1)
		{
			parentSpan.appendChild(document.createTextNode(' ')); // add space outside span
		}
	}
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

function createCleanArrayFromText(text)
{
	var textArray = {};

	if(text)
	{
		textArray = text.split(' ');
	}

	textArray = splitByNonReadable(textArray);	
		
	return textArray;
}

function canSpansBeAddedToCurrentNode(node)
{
	var hiddenDiv = isDivClassNameHidden(node);

	if(hiddenDiv)
	{
		return false;
	}

	var onlyNonReadableText = isNodeOnlyNonReadableText(node.nodeValue);

	if(onlyNonReadableText)
	{
		return false;
	}

	var parentElementIsHidden = isParentParagraphOrDivHidden(node);

	if(parentElementIsHidden)
	{
		return false;
	}

	if(node.nodeType == 3)
	{
		switch(node.parentNode.nodeName.toLowerCase())
		{
			case 'noscript':
			case 'script':
			case 'comment':
				return false;
			default:
				return true;
		}
	}

	return false;
}

function isParentParagraphOrDivHidden(node)
{
	var element = findFirstParagraphOrDiv(node);
	
	if(element && element.style && element.style.display.toLowerCase() === 'none')
	{
		return true;
	}
	
	return false;
}

function isNodeOnlyNonReadableText(text)
{
	if(text)
	{
		var replacedString = text.replace(/[\x0A|\x0D|\x20]/g, "");
		
		if(replacedString.length === 0)
		{
			return true;
		}		
	}

	return false;
}

function isDivClassNameHidden(node)
{
	var divElement = findUpTag(node, "div");	
	
	if(divElement && divElement.className.toLowerCase() == "hidden") 
	{
		return true;
	}

	return false;
}

function splitByNonReadable(textArray) 
{
	//iterate each element
	for(var i=0; i < textArray.length; i++)
	{
		//remove element
		var text = textArray[i].split("");
		textArray.splice(i,1);
		var result = "";
		
		for(var j=0; j< text.length; j++)
		{
			//split by chr(10)
			if(text[j].charCodeAt(0) == 10)
			{
				textArray.splice((i++), 0, result);
				result = "";
			}
			else
			{
				result += text[j];
			}
		}
		
		textArray.splice((i), 0, result);
	}
	
	return textArray;
}

function removeSpans() 
{
	for(var currentSpan = 0; currentSpan < words; currentSpan++)
	{
		var padSpanWord = getPadSpanWord(currentSpan);
		removeElementsByClassName(padSpanWord);
	}
}

function removeElementsByClassName(className) 
{
	element = document.getElementById(className);
	element.parentNode.replaceChild(document.createTextNode(element.innerHTML), element);
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