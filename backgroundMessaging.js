function BackgroundMessaging() 
{
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		messaging.messageReceived(request, sender, sendResponse);
	});

	this.messageReceived = function(request, sender, sendResponse) 
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
	
	this.getSettings = function() 
	{
		chrome.extension.sendRequest({
			type: "requestAllSettings"
		});
	}
	
	this.recordRead = function() 
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
}