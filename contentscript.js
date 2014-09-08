var words=0;
var currentWordCount=0;
var settingsMode=false;
var readerRunning = false;
var paused = false;
var settings = {};
var wpmTimeout = 0;
var firstLoop = true;
var newLine = false;
var scrollByDistance = 0;
var scrollMiddle = 0;
var pxVariance = 6;

//loop variables
var totalTime = 0;

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
			
		// text styles background
		settings.NonReadingBold = JSON.parse(request.NonReadingBold);
		settings.NonReadingUnderline = JSON.parse(request.NonReadingUnderline);
		settings.NonReadingItalic = JSON.parse(request.NonReadingItalic);
		settings.NonReadingStrikethrough = JSON.parse(request.NonReadingStrikethrough);
			
		// options
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
			
		afterSettingsLoaded();
	} 
	else if(request.type == "startReader")
	{
		startReading();
	}
}	

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) 
	{
		messageReceived(request, sender, sendResponse);
	}
);

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

/*jshint multistr: true */
	style.innerHTML = '#navbar.navbar_absolute {\
	  position:absolute;\
	  font-family: Helvetica, sans-serif;\
	  z-index: 1000;\
	  font-size: 12px;\
	  top:5px;\
	  width:200px;\
	  right:5px;\
	  height:50px;\
	  border:2px solid;\
	  padding:15px;\
	  border-radius:25px;\
	  float:left;\
	  align:left;\
	  background: -webkit-linear-gradient(top, #ffffff 0%,#e5e5e5 100%);\
	}\
	\
	#navbar.navbar_fixed \
	{\
	  position:fixed;\
	  font-family: Helvetica, sans-serif;\
	  z-index: 1000;\
	  font-size: 12px;\
	  top:5px;\
	  width:200px;\
	  right:5px;\
	  height:50px;\
	  border:2px solid;\
	  padding:15px;\
	  border-radius:25px;\
	  float:left;\
	  align:left;\
	  background: -webkit-linear-gradient(top, #ffffff 0%,#e5e5e5 100%);\
	}';

	document.getElementsByTagName('head')[0].appendChild(style);
	document.addEventListener('DOMContentLoaded', function() { 
		window.addEventListener("scroll",navBarResetTop,false);
	});

	iDiv = document.createElement('div');
	iDiv.id = 'navbar';
	iDiv.className = 'navbar_fixed';
	document.getElementsByTagName('body')[0].appendChild(iDiv);
	
	iDiv.innerHTML = 'Words Per Minute: <span id=\'words_per_minute\'></span></br>Words Read: <span id=\'words_read\'></span></br>Time Elapsed: <span id=\'time_elapsed\'></span>';
	
	var elImage = document.createElement('img');
	elImage.setAttribute('src', chrome.extension.getURL('cross.png'));
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
	var pauseEl = document.getElementById("pauseText");
	pauseEl.style.color = "blue";
	
	if(startTime > 0 && currentWordCount < words)
	{
		paused = !paused;
		
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
	var scrollTop=document.documentElement.scrollTop||document.body.scrollTop;
	if(scrollTop>navbar_top&&navbar.className==="navbar_absolute") 
	{
		document.getElementById("navbar").className="navbar_fixed";
	}
	else if(scrollTop<navbar_top&&navbar.className==="navbar_fixed") 
	{
		document.getElementById("navbar").className="navbar_absolute";
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
	setUpOnScreenDisplay();
	
	if(!settings.OnScreenDisplay || settingsMode)
	{
		closeOnScreenDisplay();
	}
}

if (window == top) 
{
	window.addEventListener('keyup', doKeyPress, false); 
} 

function doKeyPress(e)
{
	spacebarKeyCharCode = 32;
	
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
			window.scrollTo(0, parseFloat(document.getElementById("leftArrow").style.top.replace("px", "") - scrollMiddle));
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
			highlightBlock();
		}
		else
		{
			alert("No text Highlighted for reading.");
		}
	}
	else
	{
		endWord = currentWordCount;
		currentWordCount = words;
		readerRunning=false;
		recordRead();
		alert("Reader stopped.");
	}	
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

//entry point of highlighting
function highlightBlock() 
{
	var selection;
	var nodes;
	var startOffset;
	var endOffset;
	wpmTimeout = 60000 / settings.WordsPerMinute;
	var stopReadingTime = (settings.StopAfterTimeMinutes * 60 * 1000) + (settings.StopAfterTimeSeconds * 1000);

	if(!settingsMode)
	{
		serialisedSelection = rangy.serializeSelection();
	}
	
	readerRunning = true;
	readText = window.getSelection().toString();

	if(!settings.ExcludeNonReadingText)
	{
		makeEditableAndHighlight(settings.cpHexNonReadingBg, settings.cpHexNonReadingFg);		
	}
		
	selection = window.getSelection().getRangeAt(0).startContainer.parentNode;	
	nodes = getSelectedNodes();	
	startOffset = window.getSelection().getRangeAt(0).startOffset;
	endOffset = window.getSelection().getRangeAt(0).endOffset;	
		
	addSpansToTextNodes(nodes, startOffset, endOffset);
	
	while(getWordElement(currentWordCount) === null)
	{
		currentWordCount++;
	}

	var nonReadingStyle = getWordElement(currentWordCount).style;
		
	//left Arrow
	var element = getWordElement(currentWordCount);
	
	var elImage = document.createElement('img');

	// set the source for the image element
	elImage.setAttribute('src', chrome.extension.getURL('arrowLeft.png'));
	elImage.setAttribute('id', 'leftArrow');
	console.log(chrome.extension.getURL('arrow.png')); 	
	elImage.style.position = 'absolute';
	
	document.getElementsByTagName('body')[0].appendChild(elImage);
		
	// up Arrow
	var elUpArrow = document.createElement('img');

	// set the source for the image element
	elUpArrow.setAttribute('src', chrome.extension.getURL('arrowUp.png'));
	elUpArrow.setAttribute('id', 'upArrow');
	elUpArrow.style.position = 'absolute';
	
	document.getElementsByTagName('body')[0].appendChild(elUpArrow);
	
	setGuideArrows(element);
	
	if(!settingsMode)
	{
		window.scrollTo(0, parseFloat(document.getElementById("leftArrow").style.top.replace("px", "") - scrollMiddle));
	}
	
	window.getSelection().removeAllRanges();
	
	startWord = currentWordCount;
	
	currentWordCount--;
	
	firstLoop = true;
	var timeout = 0;
	startTime = +new Date();
	
	if(settings.TextHighlight)
	{
		runMainLoopTextHighlight();
	}
	else if(settings.ImageHighlight)
	{
		runMainLoopImageHighlight();
	}

	console.log(selection.innerHTML);
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
		
		if(currentWordCount < words && !(settings.StopAfterWords && currentWordCount > settings.StopAfterWordsCount) && !(settings.StopAfterTime && totalTime > stopReadingTime))
		{			
			timeout = wpmTimeout;
			
			if(settings.WordPause && settings.PauseWords > 0 && settings.PauseSeconds > 0 && currentWordCount > 0 && currentWordCount % settings.PauseWords === 0)
			{
				timeout += (settings.PauseSeconds * 1000);	
				pauseTime += (settings.PauseSeconds * 1000);	
			}

			if(newLine)
			{
				if(settings.PauseAtStartOfLine)
				{
					timeout += settings.PauseAtStartOfLineMilliseconds;
					pauseTime += settings.PauseAtStartOfLineMilliseconds;
				}
				
				if(settings.AutoScroll && !settingsMode)
				{
					window.scrollBy(0, scrollByDistance);
				}
				
				newLine=false;
			}
				
			totalTime += timeout;
			
			firstLoop = false;
		
			moveUpArrow(timeout, lineLength.increment);		
			
			if(settings.OnScreenDisplay && !settingsMode)
			{
				updateOnScreenDisplay();
			}
			
			
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
			endTime = +new Date();
			endWord = currentWordCount;
			currentWordCount = words;
			readerRunning=false;
			recordRead();
		}
	}
	mainLoopFunction();
}

function updateOnScreenDisplay() 
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
	timeElapsed.innerHTML = hours.lpad("0", 2) + ':' + mins.lpad("0", 2) + ':' + secs.lpad("0", 2);
}

function moveUpArrow(timeout, increment) 
{
	var totalIncrementTimeout = 0;
	var timeoutIncrement = timeout / increment;
	
	function moveArrowFunction () 
	{	
		if(totalIncrementTimeout < timeout)
		{
			var img = document.getElementById("upArrow");
			img.style.left = (parseInt(img.style.left.replace('px', '')) + 1) + 'px';
		
			totalIncrementTimeout += timeoutIncrement;
						
			setTimeout(moveArrowFunction, timeoutIncrement);
		}
		else
		{
			//finished
		}
	}	
	moveArrowFunction();
}

function getLengthOfCurrentLine() 
{
	var startSpan = getWordElement(currentWordCount);
	var tempSpan;
	var endOfLine = 0;
	var left = startSpan.getBoundingClientRect().left + window.scrollX;
	var bottom = startSpan.getBoundingClientRect().bottom + window.scrollY;
	var tempLeft = left;
	var tempBottom = bottom;
	var returnObject = {};
	
	for(var i=1; i < words && endOfLine === 0; i++)
	{
		var paddedSpan = getPadSpanWord(currentWordCount + i);
		tempSpan = document.getElementById(paddedSpan);
		if(tempSpan)
		{
			tempBottom = tempSpan.getBoundingClientRect().bottom + window.scrollY;

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
	
	if(endOfLine === 0)
	{
		endOfLine = words;
		var eolPadSpan =getPadSpanWord(currentWordCount + endOfLine);
		tempSpan = document.getElementById(eolPadSpan);
	}
	else
	{
		var tempPadSpanElse = getPadSpanWord(currentWordCount + endOfLine - 1);
		tempSpan = document.getElementById(tempPadSpan);
	}
	
	var tempPadSpan = getPadSpanWord(currentWordCount + endOfLine - 1);
	tempSpan = document.getElementById(tempPadSpan);
	
	var right = tempSpan.getBoundingClientRect().left + (tempSpan.getBoundingClientRect().width /2) + window.scrollX;
	var length = right - left;
	var increment = length / endOfLine;
	
	document.getElementById("upArrow").style.top = (bottom + 'px');
	document.getElementById("upArrow").style.left = (left + 'px');
	
	returnObject = {left: left, increment: increment, pixelLength:length, noWords: endOfLine};
	console.log("left", left, "right", right, "length", length);
	return returnObject;
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
		if(currentWordCount < words && !(settings.StopAfterWords && currentWordCount > settings.StopAfterWordsCount) && !(settings.StopAfterTime && totalTime > stopReadingTime))
		{			
			var padSpan = getPadSpanWord(currentWordCount);
			var element = document.getElementById(padSpan);
			
			// null spans coming through from nodes withough parent elements when setting spans
			if(element)
			{
				setGuideArrows(element);
					
				var nonReadingStyle = element.style;
				
				element.style.background = settings.cpHexReadingBg;		
				element.style.color = settings.cpHexReadingFg;
						
				timeout = wpmTimeout;
				
				if(settings.WordPause && settings.PauseWords > 0 && settings.PauseSeconds > 0 && currentWordCount > 0 && currentWordCount % settings.PauseWords === 0)
				{
					timeout += (settings.PauseSeconds * 1000);	
					pauseTime += (settings.PauseSeconds * 1000);	
				}

				if(newLine)
				{
					if(settings.PauseAtStartOfLine)
					{
						timeout += settings.PauseAtStartOfLineMilliseconds;
						pauseTime += settings.PauseAtStartOfLineMilliseconds;
					}
					
					if(settings.AutoScroll && !settingsMode)
						window.scrollBy(0, scrollByDistance);
					
					newLine=false;
				}
				
				//allow time for scroll to top
				if(newLine)
				{
					timeout += 1500;
					pauseTime += 1500;
				}
					
				totalTime += timeout;
				
				firstLoop = false;
			}
			else
				timeout = 0;
				
			if(settings.OnScreenDisplay && !settingsMode)
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
			endTime = +new Date();
									
			endWord = currentWordCount;
			currentWordCount = words;
			readerRunning=false;
			recordRead();
		}
	}
	setTimeout(f, 1500); //delay to allow time to scroll for start for large chunks of text
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
	elImage = document.getElementById("leftArrow");
	var rect = elSpan.getBoundingClientRect();
	var parentSpan = findUpTag(elSpan, "P");

	if(!parentSpan)
	{
		parentSpan = findUpTag(elSpan, "DIV");
	}
	
	if(!parentSpan)
	{
		parentSpan = elSpan;
	}
	
	parentRect = parentSpan.getBoundingClientRect();
	
	elImage.style.left = (parentRect.left + window.scrollX - (elImage.clientWidth + 2)) + "px"; 
	
	var newTop = ((rect.top + rect.bottom)/2) + window.scrollY - (elImage.clientHeight/2);
	var oldTop = parseFloat(elImage.style.top.replace('px', ''));
	
	if(Math.floor(newTop) > Math.floor(oldTop) + pxVariance || Math.floor(newTop) < Math.floor(oldTop) - pxVariance) 
	{
		newLine = true;
		console.log("setGuideArrows -> newline = true");
		scrollByDistance = newTop - oldTop;
	}	
	
	elImage.style.top = newTop + "px";
	
	if(!settings.GuideArrows || settingsMode)
	{
		elImage.style.visibility = 'hidden';
	}
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
		var divEl = findUpTag(nodes[i], "div");
		var hiddenDiv = false;
		
		if(divEl && divEl.className.toLowerCase() == "hidden") 
		{
			hiddenDiv = true;
		}
		
		var text = nodes[i].nodeValue;

		var endText = "";
		var textNode = nodes[i];
		var parentSpan = document.createElement('span');
		
		var p = nodes[i].parentNode;
	
		if(nodes[i].nodeType == 3 && !(nodes[i].parentNode.nodeName.toLowerCase() == 'noscript' || nodes[i].parentNode.nodeName.toLowerCase() == 'script' || nodes[i].parentNode.nodeName.toLowerCase() == 'comment') && !hiddenDiv)
		{
			//trim selection for first block
			if(firstBlockOfText)
			{
				if(fromOffset > 0)
				{
					fromOffset = text.lastIndexOf(' ', fromOffset);
				}
				
				if(fromOffset > 0)
				{
					parentSpan.appendChild(document.createTextNode(text.substr(0,fromOffset)));
					text = text.substr(fromOffset);
					firstBlockOfText = false;
				}							
			}
			
			//trim selection for last block
			if(i == nodes.length - 1)
			{
				if(toOffset < text.length)	
				{
					toOffset += text.substr(toOffset).indexOf(' ');
				}
				
				if(toOffset < text.length)
				{
					endText = text.substr(toOffset);
					text = text.substr(0, toOffset);
				}
			}	
			
			var textArray = [];
			if(text)	
			{
				textArray = text.split(' ');
			}

			textArray = splitByNonReadable(textArray);	

			// add spans to words
			for(var j=0; j< textArray.length;j++)
			{
				if(textArray[j].indexOf("\r") == -1 && textArray[j].indexOf("\n") == -1 && textArray[j].length > 0)
				{
					var span = document.createElement('span');
					span.id = getPadSpanWord(words++);
									
					span.appendChild(document.createTextNode(textArray[j]));
					
					// don't want to add a space if last word or is an array of 1 - adding space to span for imageHighlight to get correct length
					if(settings.ImageHighlight)
					{
						if(textArray.length > 1 && j < textArray.length-1)
						{
							span.appendChild(document.createTextNode(' '));
						}
			}

					parentSpan.appendChild(span);
					
					// don't want to add a space if last word or is an array of 1 - adding space after span for textHighlight to get exact word
					if(settings.TextHighlight)
					{
						if(textArray.length > 1 && j < textArray.length-1)
						{
							parentSpan.appendChild(document.createTextNode(' '));
						}
					}

				}// add line feeds/carriage returns out of span, length-1 to prevent space half way through word at end of selection
				else if(textArray[j].length === 0 || j != textArray.length - 1)
				{
					parentSpan.appendChild(document.createTextNode('\n '));	
				}
				else 
				{
					parentSpan.appendChild(document.createTextNode(textArray[j]));				
				}
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
			//split by nonprintable characters and cariage returns
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
	for(var currentSpan = 0; currentSpan < words; i++)
	{
		var padSpanWord = getPadSpanWord(currentSpan);
		removeElementsByClass(padSpanWord);
	}
}

function removeElementsByClass(className) 
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
