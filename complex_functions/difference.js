const { diffWordsWithSpace } = require('diff');

module.exports = (original, corrected) => {
    const differences = diffWordsWithSpace(original, corrected);

    let crossedText = '';
    let highlightedText = '';
    let removedText = '';

    differences.forEach(part => {
        if (part.removed) {
            // Append the added part as the correct version after the incorrect part
            crossedText += `~~${part.value}~~`;
        } else if (part.added) {
            // Store the removed part to append the correct version later
            removedText = `**${part.value}**`;
        } else {
            if (removedText) {
                highlightedText += removedText;
                removedText = '';
            }
            crossedText += part.value
            highlightedText += part.value;
        }
    });

    // If there is any trailing removed text, append it
    if (removedText) {
        highlightedText += removedText;
    }

    return {crossedText, highlightedText};
}
