var first_run = false;

if (!localStorage['ran_before']) 
{
	first_run = true;
	localStorage['ran_before'] = '1';
}

if (first_run) 
{
	localStorage["cpHexReadingBg"] = "#fbfaf9";
	localStorage["cpHexReadingFg"] = "#191313";
	localStorage["cpHexNonReadingBg"] = "#f7ff00";
	localStorage["cpHexNonReadingFg"] = "#342c2c";
	localStorage["ReadingBold"] = false;
	localStorage["ReadingUnderline"] = false;
	localStorage["ReadingItalic"] = false;
	localStorage["ReadingStrikethrough"] = false;
	localStorage["NonReadingBold"] = false;
	localStorage["NonReadingUnderline"] = false;
	localStorage["NonReadingItalic"] = false;
	localStorage["NonReadingStrikethrough"] = false;
	localStorage["WordsPerMinute"] = "450";
	localStorage["WordPause"] = false;
	localStorage["PauseSeconds"] = "10"; 
	localStorage["AutoScroll"] = true;
	localStorage["PauseWords"] = "1000";
	localStorage["ShortCutKey"] = "Z";
	localStorage["StopAfterWords"] = false;
	localStorage["StopAfterWordsCount"] = "1000";
	localStorage["StopAfterTime"] = false;
	localStorage["StopAfterTimeMinutes"] = "5"; 
	localStorage["StopAfterTimeSeconds"] ="0";
	localStorage["OnScreenDisplay"] = false;
	localStorage["PauseAtStartOfLine"] = false;
	localStorage["PauseAtStartOfLineMilliseconds"] = "0";	
	localStorage["GuideArrows"] = true;
	localStorage["TextHighlight"] = false;
	localStorage["ImageHighlight"] = true;
	localStorage["ExcludeNonReadingText"] = false;
	localStorage["AutoScrollHeight"] = "50";
	localStorage["GuideImageName"] = "arrowUp.png";
	localStorage["ShadedBackground"] = false;
}

var id = chrome.contextMenus.create( {
		"title": "Read Selected Text", 
		"contexts":["selection"], 
		"onclick": genericOnClick
	});

function genericOnClick(info, tab) 
{
	var returnMessage = new Object();
	returnMessage.type = "startReader";
 	sendMessage(returnMessage);
}

var database;
var request = window.indexedDB.open("reader",1);

request.onerror = function(event) {
	console.log(event.target.errorCode);
};

request.onsuccess = function(event) 
{
	database=request.result;
};

request.onupgradeneeded = function(event) 
{
	var db = event.target.result;
	var objectStore = db.createObjectStore(
		"readEntry", 
		{ 
			keyPath: "id",
			autoIncrement: true
		});
};

function addRecord(readEntry) 
{
	if(database)
	{		
		var transaction = database.transaction(["readEntry"], "readwrite");
		var objectStore = transaction.objectStore("readEntry");
		var request=objectStore.put(readEntry);
		
		request.onsuccess = function(event) {};
	}
}

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) 
{
	var returnMessage = new Object();
	console.log("Message received from content script:'" + request.type + "'");
	
	if(request.type)
	{
		if(request.type == "requestAllSettings")
		{
			returnMessage.type = "sendAllSettings";
			
			returnMessage.cpHexReadingBg = (typeof localStorage["cpHexReadingBg"] == 'undefined')? "#ffffff" : localStorage["cpHexReadingBg"];
			returnMessage.cpHexReadingFg = (typeof localStorage["cpHexReadingFg"] == 'undefined')? "#000000" : localStorage["cpHexReadingFg"];
			returnMessage.cpHexNonReadingBg = (typeof localStorage["cpHexNonReadingBg"] == 'undefined')? "#ffffff" : localStorage["cpHexNonReadingBg"];
			returnMessage.cpHexNonReadingFg = (typeof localStorage["cpHexNonReadingFg"] == 'undefined')? "#000000" : localStorage["cpHexNonReadingFg"];			
			returnMessage.ReadingBold = (typeof localStorage["ReadingBold"] == 'undefined')? false : localStorage["ReadingBold"];
			returnMessage.ReadingUnderline = (typeof localStorage["ReadingUnderline"] == 'undefined')? false : localStorage["ReadingUnderline"];
			returnMessage.ReadingItalic = (typeof localStorage["ReadingItalic"] == 'undefined')? false : localStorage["ReadingItalic"];
			returnMessage.ReadingStrikethrough = (typeof localStorage["ReadingStrikethrough"] == 'undefined')? false : localStorage["ReadingStrikethrough"];
			returnMessage.NonReadingBold = (typeof localStorage["NonReadingBold"] == 'undefined')? false : localStorage["NonReadingBold"];
			returnMessage.NonReadingUnderline = (typeof localStorage["NonReadingUnderline"] == 'undefined')? false : localStorage["NonReadingUnderline"];
			returnMessage.NonReadingItalic = (typeof localStorage["NonReadingItalic"] == 'undefined')? false : localStorage["NonReadingItalic"];
			returnMessage.NonReadingStrikethrough = (typeof localStorage["NonReadingStrikethrough"] == 'undefined')? false : localStorage["NonReadingStrikethrough"];			
			returnMessage.WordsPerMinute = (typeof localStorage["WordsPerMinute"] == 'undefined')? "200" : localStorage["WordsPerMinute"];
			returnMessage.WordPause = (typeof localStorage["WordPause"] == 'undefined')? false : localStorage["WordPause"];
			returnMessage.PauseSeconds = (typeof localStorage["PauseSeconds"] == 'undefined')? "10" : localStorage["PauseSeconds"];
			returnMessage.AutoScroll = (typeof localStorage["AutoScroll"] == 'undefined')? false : localStorage["AutoScroll"];
			returnMessage.PauseWords = (typeof localStorage["PauseWords"] == 'undefined')? "1000" : localStorage["PauseWords"];
			returnMessage.ShortCutKey = (typeof localStorage["ShortCutKey"] == 'undefined')? "K": localStorage["ShortCutKey"];
			returnMessage.StopAfterWords = (typeof localStorage["StopAfterWords"] == 'undefined')? false : localStorage["StopAfterWords"];
			returnMessage.StopAfterWordsCount = (typeof localStorage["StopAfterWordsCount"] == 'undefined')? "1000" : localStorage["StopAfterWordsCount"];
			returnMessage.StopAfterTime = (typeof localStorage["StopAfterTime"] == 'undefined')? false : localStorage["StopAfterTime"];
			returnMessage.StopAfterTimeMinutes = (typeof localStorage["StopAfterTimeMinutes"] == 'undefined')? "5" : localStorage["StopAfterTimeMinutes"];
			returnMessage.StopAfterTimeSeconds = (typeof localStorage["StopAfterTimeSeconds"] == 'undefined')? "0" : localStorage["StopAfterTimeSeconds"];
			returnMessage.OnScreenDisplay = (typeof localStorage["OnScreenDisplay"] == 'undefined')? false : localStorage["OnScreenDisplay"];
			returnMessage.PauseAtStartOfLine = (typeof localStorage["PauseAtStartOfLine"] == 'undefined')? false : localStorage["PauseAtStartOfLine"];
			returnMessage.PauseAtStartOfLineMilliseconds = (typeof localStorage["PauseAtStartOfLineMilliseconds"] == 'undefined')? false : localStorage["PauseAtStartOfLineMilliseconds"];
			returnMessage.GuideArrows = (typeof localStorage["GuideArrows"] == 'undefined')? false : localStorage["GuideArrows"];
			returnMessage.TextHighlight = (typeof localStorage["TextHighlight"] == 'undefined')? false : localStorage["TextHighlight"];
			returnMessage.ImageHighlight = (typeof localStorage["ImageHighlight"] == 'undefined')? false : localStorage["ImageHighlight"];			
			returnMessage.ExcludeNonReadingText = (typeof localStorage["ExcludeNonReadingText"] == 'undefined')? false : localStorage["ExcludeNonReadingText"];
			returnMessage.AutoScrollHeight = (typeof localStorage["AutoScrollHeight"] == 'undefined')? "50" : localStorage["AutoScrollHeight"];			
			returnMessage.GuideImageName = (typeof localStorage["GuideImageName"] == 'undefined')? "arrowUp.png" : localStorage["GuideImageName"];
			returnMessage.ShadedBackground = (typeof localStorage["ShadedBackground"] == 'undefined')? false : localStorage["ShadedBackground"];
		}
		else if(request.type == "submitReadEntry")
		{
			addRecord(request.recordObject);
		}
	}

	sendMessage(returnMessage);
});

function sendWordsOverTime(senderId) 
{
	var wordTimeArray = getWordTimeArray();
	var returnMessage = new Object();
	returnMessage.type = "sendWordsOverTime";
	returnMessage.WordTimeArray = wordTimeArray;
	
	//TODO:modify array to word count per day (group by ranges)
	sendMessageById(returnMessage, senderId);
}

function sendMessageById(messageToReturn, tabId)
{
	chrome.windows.getCurrent(function(win) { 
		console.log(win); 
		chrome.tabs.sendMessage(win.id, messageToReturn);
	}); 
}

function sendMessage(messageToReturn)
{
	chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.sendMessage(tab.id, messageToReturn);
	});
}
