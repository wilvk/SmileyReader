function ReadingLeftArrow()
{
	this.createLeftArrowImage = function()
	{
		var imageElement = document.createElement('img');

		imageElement.setAttribute('src', chrome.extension.getURL('images/arrowLeft.png'));
		imageElement.setAttribute('id', 'leftArrow');
		imageElement.style.position = 'absolute';
		imageElement.style.zIndex = 99999;
		document.getElementsByTagName('body')[0].appendChild(imageElement);
	}
	
	this.setGuideArrows = function(elementSpan) 
	{
		var yVals = this.getNewTopOldTop(elementSpan);

		if(Math.floor(yVals.newTop) > Math.floor(yVals.oldTop) + pxVariance || Math.floor(yVals.newTop) < Math.floor(yVals.oldTop) - pxVariance) 
		{
			newLine = true;
			scrollByDistance = yVals.newTop - yVals.oldTop;
		}

		var leftArrowImage = document.getElementById("leftArrow");
		leftArrowImage.style.top = yVals.newTop + "px";	
	}

	this.getNewTopOldTop = function(elementSpan)
	{
		leftArrowImage = document.getElementById("leftArrow");
		var boundingRectangle = elementSpan.getBoundingClientRect();

		var parentSpan = findFirstParagraphOrDiv(elementSpan);
		var parentRect = parentSpan.getBoundingClientRect();

		leftArrowImage.style.left = (parentRect.left + window.scrollX - (leftArrowImage.clientWidth + 2)) + "px"; 

		var oldTop = parseFloat(leftArrowImage.style.top.replace('px', ''));
		var newTop = ( (boundingRectangle.top + boundingRectangle.bottom) / 2) + window.scrollY - (leftArrowImage.clientHeight / 2 );	

		return {newTop : newTop, oldTop : oldTop};
	}
	
	this.getElementSetLeftArrow = function(CountOfCurrentWords)
	{
		var element = getWordElement(CountOfCurrentWords);

		if(element)
		{
			this.setGuideArrows(element);
		}
	}
}