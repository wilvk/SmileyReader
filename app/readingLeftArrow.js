function ReadingLeftArrow()
{	
	this.pxVariance = 2;
	
	this.createLeftArrowImage = function()
	{
		var imageElement = document.createElement('img');

		imageElement.setAttribute('src', chrome.extension.getURL('images/arrowLeft.png'));
		imageElement.setAttribute('id', 'leftArrow');
		imageElement.style.position = 'absolute';
		imageElement.style.zIndex = 99999;
		document.getElementsByTagName('body')[0].appendChild(imageElement);
	}

	this.createLeftArrowImage();
	
	this.setLeftArrowPosition = function(elementSpan) 
	{
		this.setLeftArrowLeftPosition(elementSpan);
		
		var yVals = this.getNewTopOldTop(elementSpan);

		this.setScrollByDistanceAndNewLineBasedOnPixelVariation(yVals);
	
		this.setLeftArrowImageTop(yVals.newTop);
	}
	
	this.setScrollByDistanceAndNewLineBasedOnPixelVariation = function(yVals)
	{
		if(Math.floor(yVals.newTop) > Math.floor(yVals.oldTop) + this.pxVariance || Math.floor(yVals.newTop) < Math.floor(yVals.oldTop) - this.pxVariance) 
		{
			newLine = true;
			scrollByDistance = yVals.newTop - yVals.oldTop;
		}
	}
	
	this.setLeftArrowImageTop = function(top)
	{
		var leftArrowImage = document.getElementById("leftArrow");
		leftArrowImage.style.top = top + "px";
	}

	this.getNewTopOldTop = function(elementSpan)
	{
		var leftArrowImage = document.getElementById("leftArrow");
		var boundingRectangle = elementSpan.getBoundingClientRect();	
		
		var oldTop = parseFloat(leftArrowImage.style.top.replace('px', ''));
		var newTop = ( (boundingRectangle.top + boundingRectangle.bottom) / 2) + window.scrollY - (leftArrowImage.clientHeight / 2 );	

		return {newTop : newTop, oldTop : oldTop};
	}
	
	this.setLeftArrowLeftPosition = function(elementSpan)
	{
		var leftArrowImageLeftPosition = this.getLeftArrowImageLeftPosition(elementSpan);
		this.setLeftArrowImageLeft(leftArrowImageLeftPosition);
	}
	
	this.getLeftArrowImageLeftPosition = function(elementSpan)
	{
		var leftArrowImage = document.getElementById("leftArrow");
		var parentSpan = findFirstParagraphOrDiv(elementSpan);
		var parentRect = parentSpan.getBoundingClientRect();

		return (parentRect.left + window.scrollX - (leftArrowImage.clientWidth + 2)) + "px";
	}
	
	this.setLeftArrowImageLeft = function(left)
	{
		var leftArrowImage = document.getElementById("leftArrow");
		leftArrowImage.style.left = left;
	}
	
	this.getElementSetLeftArrow = function(CountOfCurrentWords)
	{
		var element = getWordElement(CountOfCurrentWords);

		if(element)
		{
			this.setLeftArrowPosition(element);
		}
	}
}