function OnScreenDisplay() 
{
	var floatingDiv;

	this.setUpOnScreenDisplay = function() 
	{
		var styleElement = document.createElement('style');
		styleElement.type = 'text/css';

		styleElement.innerHTML = '#navbar.navbar_absolute {position:absolute; font-family: Helvetica, sans-serif; z-index: 1000; font-size: 12px; top:5px; width:200px; right:5px; height:50px; border:2px solid; padding:15px; border-radius:25px; float:left; align:left;\
		background: -webkit-linear-gradient(top, #ffffff 0%,#e5e5e5 100%); }\
		#navbar.navbar_fixed { position:fixed; font-family: Helvetica, sans-serif; z-index: 1000; font-size: 12px; top:5px; width:200px; right:5px; height:50px; border:2px solid; padding:15px; border-radius:25px; float:left; align:left;\
		background: -webkit-linear-gradient(top, #ffffff 0%,#e5e5e5 100%);}';

		document.getElementsByTagName('head')[0].appendChild(styleElement);

		document.addEventListener('DOMContentLoaded', function() { 
			window.addEventListener("scroll", this.navBarResetTop, false);
		});

		floatingDiv = document.createElement('div');
		floatingDiv.id = 'navbar';
		floatingDiv.className = 'navbar_fixed';
		document.getElementsByTagName('body')[0].appendChild(floatingDiv);

		floatingDiv.innerHTML = 'Words Per Minute: <span id=\'words_per_minute\'></span></br>Words Read: <span id=\'words_read\'></span></br>Time Elapsed: <span id=\'time_elapsed\'></span>';

		this.appendCloseIconToOnScreenDisplay();
		this.appendPauseTextToOnScreenDisplay();
	}

	this.appendCloseIconToOnScreenDisplay = function()
	{
		var imageElement = document.createElement('img');
		imageElement.setAttribute('src', chrome.extension.getURL('images/cross.png'));
		imageElement.setAttribute('id', 'crossImage');
		imageElement.style.position = 'absolute';
		imageElement.style.top = "15px";
		imageElement.style.right = "20px";
		imageElement.style.cursor = "pointer";
		imageElement.onclick = this.closeOnScreenDisplay;
		floatingDiv.appendChild(imageElement);	
	}

	this.appendPauseTextToOnScreenDisplay = function()
	{
		var pauseElement = document.createElement("div");
		pauseElement.id = "pauseText";
		pauseElement.innerHTML = "Pause";
		pauseElement.style.top = "20x";
		pauseElement.style.right = "25px";
		pauseElement.style.color = "blue";
		pauseElement.style.position = 'absolute';
		pauseElement.style.cursor = "pointer";
		pauseElement.onclick = togglePause;
		floatingDiv.appendChild(pauseElement);
	}

	this.closeOnScreenDisplay = function() 
	{
		floatingDiv.style.visibility = 'hidden';	
	}

	this.updateOnScreenDisplay = function() 
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
	
	this.navBarResetTop = function() 
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
}