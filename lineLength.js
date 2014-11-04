function LineLength()
{
	this.currentWordCount;
	
	this.words;

	this.getLengthOfCurrentLine = function(CurrentWordCount, Words) 
	{
		this.currentWordCount = CurrentWordCount;
		this.words = Words;
		
		var startSpan = getWordElement(currentWordCount);
		var lastSpanOnCurrentLine;
		var left = startSpan.getBoundingClientRect().left + window.scrollX;
		var bottom = startSpan.getBoundingClientRect().bottom + window.scrollY;
		var tempLeft = left;	
		var top = startSpan.getBoundingClientRect().top + window.scrollY;

		var wordsOnCurrentLine = this.getNumberOfWordsOnCurrentLine(startSpan);

		if(wordsOnCurrentLine === 0)
		{
			wordsOnCurrentLine = words;
			lastSpanOnCurrentLine = getWordElement(currentWordCount + wordsOnCurrentLine);
		}
		else
		{
			lastSpanOnCurrentLine = getWordElement(currentWordCount + wordsOnCurrentLine - 1);
		}

		lastSpanOnCurrentLine = getWordElement(currentWordCount + wordsOnCurrentLine - 1);

		var right = lastSpanOnCurrentLine.getBoundingClientRect().left + (lastSpanOnCurrentLine.getBoundingClientRect().width /2) + window.scrollX;
		var length = right - left;
		var increment = length / wordsOnCurrentLine;

		return {left: left, bottom: bottom, top: top, increment: increment, pixelLength:length, noWords: wordsOnCurrentLine};
	}

	this.getNumberOfWordsOnCurrentLine = function(startSpan)
	{
		var pxVariance = 2;
		var bottom = startSpan.getBoundingClientRect().bottom + window.scrollY;
		var endOfLine = 0;

		for(var i = 1; i < this.words && endOfLine === 0; i++)
		{
			tempSpan = getWordElement(this.currentWordCount + i);

			if(tempSpan)
			{
				var tempBottom = tempSpan.getBoundingClientRect().bottom + window.scrollY;

				if(Math.floor(tempBottom) > Math.floor(bottom) + pxVariance || Math.floor(tempBottom) < Math.floor(bottom) - pxVariance)
				{
					endOfLine = i;
				}
			}
			else
			{
				endOfLine = i;
			}

		}
		return endOfLine;
	}
}