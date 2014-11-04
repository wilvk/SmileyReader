function ReadingUpArrow() 
{
	this.createUpArrowImage = function()
	{
		var imageElement = document.createElement('img');
		var relativeImageName = 'images/guideImages/' + settings.GuideImageName;
		
		imageElement.setAttribute('src', chrome.extension.getURL(relativeImageName));
		imageElement.setAttribute('id', 'upArrow');
		imageElement.style.position = 'absolute';
		imageElement.style.zIndex = 99999;
		document.getElementsByTagName('body')[0].appendChild(imageElement);
	}
	
	this.createUpArrowImage();
	
	this.moveUpArrow = function(timeout, increment) 
	{
		var totalIncrementTimeout = 0;
		var timeoutIncrement = timeout / increment;

		function moveArrowFunction() 
		{
			if(totalIncrementTimeout < timeout)
			{
				var upArrowImage = document.getElementById("upArrow");
				upArrowImage.style.left = (parseInt(upArrowImage.style.left.replace('px', '')) + 1) + 'px';
				totalIncrementTimeout += timeoutIncrement;			
				
				setTimeout(moveArrowFunction, timeoutIncrement);
			}
		}
		moveArrowFunction();
	}
	
	this.setUpArrowNewLinePosition = function(bottom, left)
	{
		var element = document.getElementById("upArrow");
		element.style.top = bottom + 'px';
		element.style.left = left + 'px';
	}
}