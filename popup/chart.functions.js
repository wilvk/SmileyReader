var bkg = chrome.extension.getBackgroundPage();
 
var formattedWordTimeArray;

var database = bkg.database;
var offset = new Date().getTimezoneOffset(); // offset in minutes from GMT
var wordTimeArrayLoaded = false;
var wordsPerMinuteLoaded = false;

var wordTimeArray = [];
var wordsPerMinuteArray = [];
var timeReadingArray = [];
var webArray = [];
var maxCursorKey = 0;

function getChartArrays()
{
	var avgWpmTotal = 0;
	var avgWpmCount = 0;
	var avgWpm = 0;
	var totalWords = 0;
	var totalTime = 0;
	
	if(database)
	{	
		var objectStore = database.transaction("readEntry").objectStore("readEntry");
		objectStore.openCursor().onsuccess = function(event) {
			var cursor = event.target.result;
			if (cursor) {
				var timePoint = cursor.value.DTSStart - (offset * 60 * 1000)
				
				if(cursor.value.DTSEnd && cursor.value.DTSStart)
				{
					//word time array					
					var innerWTArray = [];
					innerWTArray.push(timePoint);
					innerWTArray.push(cursor.value.Words);
					wordTimeArray.push(innerWTArray);
					
					// words per minute array
					
					var innerWPMArray = [];
					innerWPMArray.push(timePoint);
					innerWPMArray.push(cursor.value.WPM);
					wordsPerMinuteArray.push(innerWPMArray);
					
					// time spent reading
					if(cursor.value.DTSEnd > 0 && cursor.value.DTSStart > 0)
					{
						var innerTRArray = [];
						innerTRArray.push(timePoint);
						innerTRArray.push((cursor.value.DTSEnd - cursor.value.DTSStart - cursor.value.PauseTime) / (1000*60));
						timeReadingArray.push(innerTRArray);
						console.log("DTSEnd", cursor.value.DTSEnd, "DTSStart", cursor.value.DTSStart, "PauseTime", cursor.value.PauseTime);				
					}
				}
				
				// wbsite stats
				var innerWebArray = new Array();
				var webString = cursor.value.Website;
				
				var parser = document.createElement('a');
				parser.href = webString				
				webString = parser.hostname;
				var extId = chrome.i18n.getMessage("@@extension_id");
				
				if(extId != webString)
				{
					var index = -1;
					
					for(var i=0;i < webArray.length; i++)
					{
						console.log("webArray[i][0]",webArray[i][0]);
						if(webArray[i].label == webString)
						{
							index = i;
							//console.log("found");
							break;
						}
					}							
					
					console.log("index",index);
					if(index > -1)
					{
						webArray[index].data += cursor.value.Words;
					}
					else
					{
						webArray.push({label: webString, data: cursor.value.Words});
					}
				}

				//totals
				avgWpmTotal += cursor.value.WPM;
				avgWpmCount++;
				totalWords += cursor.value.Words;
				if(cursor.value.DTSEnd > 0)
					totalTime += (cursor.value.DTSEnd - cursor.value.DTSStart);
				
				// reading log
				var logEl = document.getElementById("reading_log");
				logEl.innerHTML = logEl.innerHTML + "</br>" + new Date(cursor.value.DTSStart).toLocaleString() + "&nbsp;Words: " + 
					cursor.value.Words + "&nbsp;Words Per Minute: " + cursor.value.WPM + "&nbsp;</br>Website: "+cursor.value.Website+"</br></br>";
				
				maxCursorKey = cursor.key;
				
				cursor.continue();
			}
			else
			{				
				document.getElementById("wordsRead").innerHTML = totalWords;
				document.getElementById("averageWpm").innerHTML = (avgWpmTotal + avgWpmCount == 0)? 0 : Math.round((avgWpmTotal / avgWpmCount));
				document.getElementById("totalTime").innerHTML = secondsToString(Math.round(totalTime/1000));
				document.getElementById("");
				loadWordTimeArray();
				loadWordsPerMinute();
				loadTimeReading();
				loadWebsitesViewed();
				postLoadChanges();
			}
		};	
	}
}

function postLoadChanges() {

	var logDivEl = document.getElementById("log_div");
	logDivEl.scrollTop = logDivEl.scrollHeight;
}

 function secondsToString(seconds)
{
	var numyears = Math.floor(seconds / 31536000);
	var numdays = Math.floor((seconds % 31536000) / 86400); 
	var numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
	var numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
	var numseconds = (((seconds % 31536000) % 86400) % 3600) % 60;
	return numdays + " days " + numhours + " hours " + numminutes + " minutes " + numseconds + " seconds";
}

window.onload = getChartArrays; 

var a = document.getElementById("optionsLink");
a.onclick = function() {
	chrome.tabs.create({
		url: "options.html"
	})
	return false;
}
	
function loadWordTimeArray() {
	var d = wordTimeArray;

	var options = {
		xaxis: {
			mode: "time",
		},
		selection: {
			mode: "x"
		},
		bars: {show: true}
	};

	var plot = $.plot("#placeholderWT", [{data: d, color: '#92d5ea'}], options);

	var overview = $.plot("#overviewWT", [{data: d, color: '#92d5ea'}], {
		series: {
			bars: {
				show: true,
				lineWidth: 1
			},
			shadowSize: 0
		},
		xaxis: {
			ticks: [],
			mode: "time"
		},
		yaxis: {
			ticks: [],
			min: 0,
			autoscaleMargin: 0.1
		},
		selection: {
			mode: "x"
		}
	});

	// now connect the two

	$("#placeholderWT").bind("plotselected", function (event, ranges) {

		// do the zooming

		plot = $.plot("#placeholderWT", [d], $.extend(true, {}, options, {
			xaxis: {
				min: ranges.xaxis.from,
				max: ranges.xaxis.to
			}
		}));

		// don't fire event on the overview to prevent eternal loop

		overview.setSelection(ranges, true);
	});

	$("#overviewWT").bind("plotselected", function (event, ranges) {
		plot.setSelection(ranges);
	});

}

function loadWordsPerMinute() {
	var d = wordsPerMinuteArray;

	var options = {
		xaxis: {
			mode: "time"
		},
		selection: {
			mode: "x"
		}
	};

	var plot = $.plot("#placeholderWPM", [d], options);

	var overview = $.plot("#overviewWPM", [d], {
		series: {
			lines: {
				show: true,
				lineWidth: 1
			},
			shadowSize: 0
		},
		xaxis: {
			ticks: [],
			mode: "time"
		},
		yaxis: {
			ticks: [],
			min: 0,
			autoscaleMargin: 0.1
		},
		selection: {
			mode: "x"
		}
	});

	// now connect the two

	$("#placeholderWPM").bind("plotselected", function (event, ranges) {

		// do the zooming

		plot = $.plot("#placeholderWPM", [d], $.extend(true, {}, options, {
			xaxis: {
				min: ranges.xaxis.from,
				max: ranges.xaxis.to
			}
		}));

		// don't fire event on the overview to prevent eternal loop

		overview.setSelection(ranges, true);
	});

	$("#overviewWPM").bind("plotselected", function (event, ranges) {
		plot.setSelection(ranges);
	});

}

function loadTimeReading() {
	var d = timeReadingArray;

	// helper for returning the weekends in a period

	var options = {
		xaxis: {
			mode: "time"
		},
		selection: {
			mode: "x"
		},
		bars: {show: true}
	};

	var plot = $.plot("#placeholderTR", [d], options);

	var overview = $.plot("#overviewTR", [d], {
		series: {
			bars: {
				show: true,
				lineWidth: 1
			},
			shadowSize: 0
		},
		xaxis: {
			ticks: [],
			mode: "time"
		},
		yaxis: {
			ticks: [],
			min: 0,
			autoscaleMargin: 0.1
		},
		selection: {
			mode: "x"
		}
	});

	// now connect the two

	$("#placeholderTR").bind("plotselected", function (event, ranges) {

		// do the zooming

		plot = $.plot("#placeholderTR", [d], $.extend(true, {}, options, {
			xaxis: {
				min: ranges.xaxis.from,
				max: ranges.xaxis.to
			}
		}));

		// don't fire event on the overview to prevent eternal loop

		overview.setSelection(ranges, true);
	});

	$("#overviewTR").bind("plotselected", function (event, ranges) {
		plot.setSelection(ranges);
	});

}

function loadWebsitesViewed() {
	$.plot($("#default"), webArray,
	{
        series: {
            pie: { 
                show: true,
                combine: {
                    color: '#999',
                    threshold: 0.05
                }
            }
        },
        legend: {
            show: true
        }
});
}