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
var arbitraryMaxNumberOfWordsOnAPage = 1000000;
var stopReadingTime = 0;
var textRead = "";

var totalTime = 0;
var timeout = 0;

var startTime = 0;
var endTime = 0;
var startWord = 0;
var endWord = 0;
var totalWords = 0;
var pauseTime = 0;
var website = "";
var serialisedSelection = "";

var spacebarKeyCharCode = 32;
var paper;
var readingUpArrow;
var readingLeftArrow;
var messaging;
var nonReadingStyle;

var onScreenDisplay = new OnScreenDisplay();

messaging = new BackgroundMessaging();
setTimeout(messaging.getSettings, 1000); // 1 second delay for message pump

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

function togglePause() 
{
	if(startTime > 0 && currentWordCount < words)
	{
		paused = !paused;
	}
	
	onScreenDisplay.setNavBarText();
}
  
function afterSettingsLoaded() 
{
	rangy.init();
	settingsMode = document.getElementById("non_reading_text_sample") !== null;
	scrollMiddle = window.innerHeight * (settings.AutoScrollHeight / 100);
	wpmTimeout = 60000 / settings.WordsPerMinute;
	stopReadingTime = (settings.StopAfterTimeMinutes * 60 * 1000) + (settings.StopAfterTimeSeconds * 1000);

	if(settings.OnScreenDisplay && !settingsMode)
	{
		onScreenDisplay.setUpOnScreenDisplay();
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
	textRead = getSelectedText();

	if(textRead)
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
	messaging.recordRead();
	tryRemovePaper();
	alert("Reader stopped.");
}

function getSelectedText() 
{
	var text;

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

	makeEditableAndHighlight();

	getNodesAndAddSpans();
	
	incrementCurrentWordCountToStartOfSpans();
	
	readingLeftArrow = new ReadingLeftArrow();
	readingUpArrow = new ReadingUpArrow();
	
	readingLeftArrow.getElementSetLeftArrow(currentWordCount);

	setWindowScroll();

	initialiseVariablesForNewRead();
}

function getNodesAndAddSpans()
{	
	nodes = getSelectedNodes();	
	
	var spanAppender = new SpanAppender(settings.ImageHighlight);
	nodes = spanAppender.addSpansToTextNodes(nodes);
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
	if(!settingsMode)
	{
		window.scrollTo(0, parseFloat(document.getElementById("leftArrow").style.top.replace("px", "") - scrollMiddle));
	}
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

function runMainLoopImageHighlight() 
{
	var lineIncrement;
	
	function mainLoopFunction() 
	{
		currentWordCount++;
		
		readingLeftArrow.getElementSetLeftArrow(currentWordCount);

		var tempIncrement = callNewLineFunctions();
		
		if(tempIncrement != null && tempIncrement > 0)
		{
			lineIncrement = tempIncrement;
		}

		var canContinueRunning = areWordsAndTimeCorrectToKeepRunning();

		if(canContinueRunning)
		{
			timeout = wpmTimeout;

			setPauseIfAfterPauseWordCount();

			totalTime += timeout;
			firstLoop = false;

			readingUpArrow.moveUpArrow(timeout, lineIncrement);

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

function findFirstParagraphOrDiv(element)
{
	var parentSpan = findUpTag(element, "P");

	if(!parentSpan)
	{
		parentSpan = this.findUpTag(element, "DIV") || element;
	}

	return parentSpan;
}

function endReader()
{
	endTime = +new Date();
	endWord = currentWordCount;
	currentWordCount = words;
	readerRunning = false;
	messaging.recordRead();
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
				readingLeftArrow.setLeftArrowPosition(element);
				setElementReadingColors(element);
				timeout = wpmTimeout;
				setPauseIfAfterPauseWordCount();
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

function callNewLineFunctions()
{
	if(newLine || firstLoop)
	{
		var lineLengthEvaluator = new LineLength();
	
		var lineLengths = lineLengthEvaluator.getLengthOfCurrentLine(currentWordCount, words);
		setBlackoutShading(lineLengths);
		readingUpArrow.setUpArrowNewLinePosition(lineLengths.bottom, lineLengths.left);

		setStartOfLinePause();
		setAutoScroll();
		newLine=false;
		return lineLengths.increment;
	}
}

function setElementReadingColors(element)
{
	nonReadingStyle = element.style;
	element.style.background = settings.cpHexReadingBg;		
	element.style.color = settings.cpHexReadingFg;
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

function makeEditableAndHighlight() 
{
	if(!settings.ExcludeNonReadingText)
	{
		var style = document.createElement('style');
		style.type = 'text/css';
		style.innerHTML = '*.highlightStyle { color: ' + settings.cpHexNonReadingFg + '; background-color: ' + settings.cpHexNonReadingBg + ';}';
		document.getElementsByTagName('head')[0].appendChild(style);
		highlightApplier = rangy.createCssClassApplier("highlightStyle");
		highlightApplier.toggleSelection();	
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

String.prototype.lpad = function(padString, length) 
{
	var str = this;
	while (str.length < length)
	{
		str = padString + str;
	}

	return str;
};