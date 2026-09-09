import { diffWordsWithSpace } from 'diff';

export interface TextDifference {
    /** The original text with removed parts struck through. */
    crossedText: string;
    /** The corrected text with added parts in bold. */
    highlightedText: string;
}

export function difference(original: string, corrected: string): TextDifference {
    const differences = diffWordsWithSpace(original, corrected);

    let crossedText = '';
    let highlightedText = '';
    let addedText = '';

    for (const part of differences) {
        if (part.removed) {
            crossedText += `~~${part.value}~~`;
        } else if (part.added) {
            // Keep the added part to append it after the unchanged text that follows.
            addedText = `**${part.value}**`;
        } else {
            if (addedText) {
                highlightedText += addedText;
                addedText = '';
            }
            crossedText += part.value;
            highlightedText += part.value;
        }
    }

    // Append any trailing added text.
    if (addedText) highlightedText += addedText;

    return {crossedText, highlightedText};
}
