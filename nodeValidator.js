function NodeValidator(){};

NodeValidator.prototype.canSpansBeAddedToCurrentNode = function(node)
{
	var hiddenDiv = this.isDivClassNameHidden(node);

	if(hiddenDiv)
	{
		return false;
	}

	var onlyNonReadableText = this.isNodeOnlyNonReadableText(node.nodeValue);

	if(onlyNonReadableText)
	{
		return false;
	}

	var parentElementIsHidden = this.isParentParagraphOrDivHidden(node);

	if(parentElementIsHidden)
	{
		return false;
	}

	if(node.nodeType == 3)
	{
		switch(node.parentNode.nodeName.toLowerCase())
		{
			case 'noscript':
			case 'script':
			case 'comment':
				return false;
			default:
				return true;
		}
	}

	return false;
}

NodeValidator.prototype.isDivClassNameHidden = function(node)
{
	var divElement = findUpTag(node, "div");	
	
	if(divElement && divElement.className.toLowerCase() == "hidden") 
	{
		return true;
	}

	return false;
}

NodeValidator.prototype.isNodeOnlyNonReadableText = function(text)
{
	if(text)
	{
		var replacedString = text.replace(/[\x0A|\x0D|\x20]/g, "");
		
		if(replacedString.length === 0)
		{
			return true;
		}		
	}
	
	return false;
}

NodeValidator.prototype.isParentParagraphOrDivHidden = function(node)
{
	var element = findFirstParagraphOrDiv(node);
	
	if(element && element.style && element.style.display.toLowerCase() === 'none')
	{
		return true;
	}
	
	return false;
}
