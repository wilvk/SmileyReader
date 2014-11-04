function SpanAppender(ImageHighlight) {
	this.imageHighlight = ImageHighlight;
};

SpanAppender.prototype.addSpansToTextNodes = function(nodes)
{
	var firstBlockOfText = true;
	var validator = new NodeValidator();

	for(var i=0; i< nodes.length;i++)
	{
		var text = nodes[i].nodeValue;
		var endText = "";
		var textNode = nodes[i];
		var parentSpan = document.createElement('span');

		var p = nodes[i].parentNode;	
		
		var spansCanBeAdded = validator.canSpansBeAddedToCurrentNode(nodes[i]);

		if(spansCanBeAdded)
		{			
			var textArray = this.createCleanArrayFromText(text);		

			for(var j=0; j< textArray.length;j++)
			{
				this.appendSpans(parentSpan, textArray, j);
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
	
	return nodes;
}

SpanAppender.prototype.createCleanArrayFromText = function(text)
{
	var textArray = {};

	if(text)
	{
		textArray = text.split(' ');
	}	
		
	return textArray;
}

SpanAppender.prototype.appendSpans = function(parentSpan, textArray, arrayItem)
{
	var canAppendSpan = this.isTextValidToAppendTo(textArray[arrayItem]);

	if(canAppendSpan)
	{
		this.appendSpanToText(textArray, arrayItem, parentSpan);					
	}
	else if(textArray[arrayItem].length === 0 || arrayItem != textArray.length - 1)
	{
		parentSpan.appendChild(document.createTextNode('\n '));	
	}
	else 
	{
		parentSpan.appendChild(document.createTextNode(textArray[arrayItem]));				
	}
}

SpanAppender.prototype.isTextValidToAppendTo = function(text)
{
	if(text.indexOf("\r") == -1 && text.indexOf("\n") == -1 && text.length > 0)
	{
		return true;
	}
	else
	{
		return false;
	}
}

SpanAppender.prototype.appendSpanToText = function(textArray, currentTextArrayItem, parentSpan)
{
	var span = document.createElement('span');
	span.id = getPadSpanWord(words++);
	span.appendChild(document.createTextNode(textArray[currentTextArrayItem]));

	if(this.imageHighlight)
	{
		if(textArray.length > 1 && currentTextArrayItem < textArray.length - 1)
		{
			span.appendChild(document.createTextNode(' '));
		}
	}

	parentSpan.appendChild(span);

	if(!this.imageHighlight)
	{
		if(textArray.length > 1 && currentTextArrayItem < textArray.length - 1)
		{
			parentSpan.appendChild(document.createTextNode(' '));
		}
	}
}

SpanAppender.prototype.createCleanArrayFromText = function(text)
{
	var textArray = {};

	if(text)
	{
		textArray = text.split(' ');
	}	
		
	return textArray;
}