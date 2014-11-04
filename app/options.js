document.addEventListener('DOMContentLoaded', function() {	
		cpReadingBg = ColorPicker(
			document.getElementById('color-picker-reading-bg'),
			function(hex, hsv, rgb) {
			  document.getElementById('reading_text_sample').style.background = hex;
			  window.cpHexReadingBg = hex;
			});    
			
		cpReadingFg = ColorPicker(
			document.getElementById('color-picker-reading-fg'),
			function(hex, hsv, rgb) {
			  document.getElementById('reading_text_sample').style.color = hex
			  window.cpHexReadingFg = hex;
			});    
			
		cpNonReadingBg = ColorPicker(
			document.getElementById('color-picker-non-reading-bg'),
			function(hex, hsv, rgb) {
			  document.getElementById('non_reading_text_sample').style.background = hex;
			  window.cpHexNonReadingBg = hex;
			});    
			
		cpNonReadingFg = ColorPicker(
			document.getElementById('color-picker-non-reading-fg'),
			function(hex, hsv, rgb) {
			  document.getElementById('non_reading_text_sample').style.color = hex
			  window.cpHexNonReadingFg = hex;
			});    
});

var navbar_top = 100;

function save_options() 
{
	if(!(typeof cpHexReadingBg == 'undefined'))
	{
		localStorage["cpHexReadingBg"] = cpHexReadingBg;
	}
	else 
	{
		localStorage["cpHexReadingBg"] = "#ffffff";
	}
	
	if(!(typeof cpHexReadingFg == 'undefined'))
	{
		localStorage["cpHexReadingFg"] = cpHexReadingFg;
	}
	else
	{
		localStorage["cpHexReadingFg"] = "#000000";
	}
	
	if(!(typeof cpHexNonReadingBg == 'undefined'))
	{
		localStorage["cpHexNonReadingBg"] = cpHexNonReadingBg;
	}
	else
	{
		localStorage["cpHexNonReadingBg"] = "#ffffff";
	}
	
	if(!(typeof cpHexNonReadingFg == 'undefined'))
	{
		localStorage["cpHexNonReadingFg"] = cpHexNonReadingFg;
	}
	else
	{
		localStorage["cpHexNonReadingFg"] = "#000000";
	}
	
	localStorage["WordsPerMinute"] = document.getElementById("WordsPerMinute").value;
	localStorage["WordPause"] = document.getElementById("WordPause").checked;
	localStorage["PauseSeconds"] = document.getElementById("PauseSeconds").value;
	localStorage["PauseWords"] = document.getElementById("PauseWords").value;
	localStorage["AutoScroll"] = document.getElementById("AutoScroll").checked;
	localStorage["ShortCutKey"] = document.getElementById("ShortCutKey").value.toUpperCase();
	localStorage["StopAfterWords"] = document.getElementById("StopAfterWords").checked;
	localStorage["StopAfterWordsCount"] = document.getElementById("StopAfterWordsCount").value;
	localStorage["StopAfterTime"] = document.getElementById("StopAfterTime").checked;
	localStorage["StopAfterTimeMinutes"] = document.getElementById("StopAfterTimeMinutes").value;
	localStorage["StopAfterTimeSeconds"] = document.getElementById("StopAfterTimeSeconds").value;
	localStorage["OnScreenDisplay"] = document.getElementById("OnScreenDisplay").checked;
	localStorage["PauseAtStartOfLine"] = document.getElementById("PauseAtStartOfLine").checked;
	localStorage["PauseAtStartOfLineMilliseconds"] = document.getElementById("PauseAtStartOfLineMilliseconds").value;
	localStorage["GuideArrows"] = document.getElementById("GuideArrows").checked;	
	localStorage["TextHighlight"] = document.getElementById("TextHighlight").checked;
	localStorage["ImageHighlight"] = document.getElementById("ImageHighlight").checked;	
	localStorage["ExcludeNonReadingText"] = document.getElementById("ExcludeNonReadingText").checked;	
	localStorage["ShadedBackground"] = document.getElementById("ShadedBackground").checked;	
	localStorage["GuideImageName"] = getSelectedGuideImageName();
	
	var autoScrollHeight = document.getElementById("AutoScrollHeight").value;
	
	if (autoScrollHeight > 100)
	{
		autoScrollHeight = 100;
	}
	
	if (autoScrollHeight < 0)
	{
		autoScrollHeight = 0;
	}
		
	localStorage["AutoScrollHeight"] = autoScrollHeight;
	
	var keyDisplay = document.getElementById("keyDisplay");
	keyDisplay.innerHTML = localStorage["ShortCutKey"];
	
	getSettings();
	
	var status = document.getElementById("status");
	status.innerHTML = "Options Saved. Pages currently open with highlighting will need to be refreshed (Shift + F5) for changes to take effect.";
	setTimeout(function() {	status.innerHTML = "";	}, 7500);
}

function getSelectedGuideImageName()
{
	var arrowChecked = document.getElementById("ArrowImage").checked;
	var smileyChecked = document.getElementById("SmileyImage").checked;
	var nyanChecked = document.getElementById("NyanImage").checked;
	
	if(arrowChecked)
	{
		return "arrowUp.png";
	}
	else if(smileyChecked)
	{
		return "smiley.png";
	}
	else if(nyanChecked)
	{
		return "nyan.png";
	}
	else
	{
		return "arrowUp.png";
	}	
}

function load_options() 
{	
	cpReadingBg.setHex(localStorage["cpHexReadingBg"]);
	cpReadingFg.setHex(localStorage["cpHexReadingFg"]);
	cpNonReadingBg.setHex(localStorage["cpHexNonReadingBg"]);
	cpNonReadingFg.setHex(localStorage["cpHexNonReadingFg"]);
	document.getElementById("WordsPerMinute").value = parseInt(localStorage["WordsPerMinute"]);
	document.getElementById("WordPause").checked = localStorage["WordPause"] == 'true'? true : false;
	document.getElementById("PauseSeconds").value = parseInt(localStorage["PauseSeconds"]);
	document.getElementById("AutoScroll").checked = localStorage["AutoScroll"] == 'true'? true : false;
	document.getElementById("PauseWords").value = parseInt(localStorage["PauseWords"]);
	document.getElementById("ShortCutKey").value = localStorage["ShortCutKey"];
	document.getElementById("StopAfterWords").checked = localStorage["StopAfterWords"] == 'true'? true : false;
	document.getElementById("StopAfterWordsCount").value = parseInt(localStorage["StopAfterWordsCount"]);
	document.getElementById("StopAfterTime").checked = localStorage["StopAfterTime"] == 'true'? true : false;
	document.getElementById("StopAfterTimeMinutes").value = parseInt(localStorage["StopAfterTimeMinutes"]);
	document.getElementById("StopAfterTimeSeconds").value = parseInt(localStorage["StopAfterTimeSeconds"]);
	document.getElementById("OnScreenDisplay").checked = localStorage["OnScreenDisplay"] == 'true'? true : false;
	document.getElementById("PauseAtStartOfLine").checked = localStorage["PauseAtStartOfLine"] == 'true'? true : false;
	document.getElementById("PauseAtStartOfLineMilliseconds").value = parseInt(localStorage["PauseAtStartOfLineMilliseconds"]);
	document.getElementById("GuideArrows").checked = localStorage["GuideArrows"] == 'true'? true : false;
	document.getElementById("TextHighlight").checked = localStorage["TextHighlight"] == 'true'? true : false;
	document.getElementById("ImageHighlight").checked = localStorage["ImageHighlight"] == 'true'? true : false;
	document.getElementById("ExcludeNonReadingText").checked = localStorage["ExcludeNonReadingText"] == 'true'? true : false;
	document.getElementById("ShadedBackground").checked = localStorage["ShadedBackground"] == 'true'? true : false;
	document.getElementById("AutoScrollHeight").value = parseInt(localStorage["AutoScrollHeight"]);
	
	setSelectedImage();
	
	var keyDisplay = document.getElementById("keyDisplay");
	keyDisplay.innerHTML = localStorage["ShortCutKey"];
}

function setSelectedImage()
{
	var imageName = localStorage["GuideImageName"];
	
	if(imageName == "arrowUp.png")
	{
		document.getElementById("ArrowImage").checked = true;
	}
	else if(imageName == "smiley.png")
	{
		document.getElementById("SmileyImage").checked = true;
	}
	else if(imageName == "nyan.png")
	{
		document.getElementById("NyanImage").checked = true;
	}
	else
	{
		document.getElementById("ArrowImage").checked = true;
	}	
}

document.addEventListener('DOMContentLoaded', load_options);
document.querySelector('#save').addEventListener('click', save_options);
	
$('.startClosed').each(function() {
	$(this).nextUntil('tr.header').slideToggle(0);
});

$('.header').click(function(){
	$(this).nextUntil('tr.header').slideToggle(500);
});		
