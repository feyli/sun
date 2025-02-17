// noinspection DuplicatedCode

const { parse } = require('minecraft-motd-util');
const spawn = require('child_process').spawn;

module.exports = (description) => {
    return new Promise((resolve) => {
        if (description.extra) {
            description = description.extra;

            let i;
            for (i = 0; i < description.length; i++) {
                if (description[i].text && description[i].text.includes('\n')) {
                    break;
                }
            }

            if (i !== description.length) {
                // split the array into two, one before '\n' and one after (taking into account any characters after '\n')
                if (description[i].text.endsWith('\n')) {
                    description = [description.slice(0, i + 1), description.slice(i + 1)];
                    description[0][description[0].length - 1].text = description[0][description[0].length - 1].text.slice(0, -1);
                } else {
                    // add the characters after '\n' to the second array
                    const newLineObject = description[i];
                    description = [description.slice(0, i), description.slice(i + 1)];
                    description[0].push({
                        ...newLineObject,
                        text: newLineObject.text.split('\n')[0]
                    })
                    description[1].unshift({
                        ...newLineObject,
                        text: newLineObject.text.split('\n')[1]
                    });
                }
            }
            description = description.map(line => {
                return line.map(part => {
                    return {
                        text: part.text,
                        styles: {
                            "color": part.color ? part.color.replaceAll('white', '#FFFFFF').replaceAll('black', '#000000').replaceAll('dark_blue', '#0000AA').replaceAll('dark_green', '#00AA00').replaceAll('dark_aqua', '#00AAAA').replaceAll('dark_red', '#AA0000').replaceAll('dark_purple', '#AA00AA').replaceAll('gold', '#FFAA00').replaceAll('gray', '#AAAAAA').replaceAll('dark_gray', '#555555').replaceAll('blue', '#5555FF').replaceAll('green', '#55FF55').replaceAll('aqua', '#55FFFF').replaceAll('red', '#FF5555').replaceAll('light_purple', '#FF55FF').replaceAll('yellow', '#FFFF55').replaceAll('reset', '#FFFFFF') : "#AAAAAA",
                            // only add font-weight: bold if the text is bold
                            "font-weight": part.bold ? 'bold' : "",
                            // only add font-style: italic if the text is italic
                            "font-style": part.italic ? 'italic' : "",
                            // only add text-decoration: underline if the text is underlined and strikethrough if the text is strikethrough
                            "text-decoration": [part.underlined ? 'underline' : undefined, part.strikethrough ? 'line-through' : undefined]
                        }
                    };
                });
            });
        } else {
            if (description.text) description = description.text;
            description = description.split('\n');
            const options = {
                formattingCharacter: '§'
            };
            description = description.map(line => {
                return parse(line, options).map(part => {
                    return {
                        text: part.text,
                        styles: {
                            "color": part.color.replaceAll('white', '#FFFFFF').replaceAll('black', '#000000').replaceAll('dark_blue', '#0000AA').replaceAll('dark_green', '#00AA00').replaceAll('dark_aqua', '#00AAAA').replaceAll('dark_red', '#AA0000').replaceAll('dark_purple', '#AA00AA').replaceAll('gold', '#FFAA00').replaceAll('gray', '#AAAAAA').replaceAll('dark_gray', '#555555').replaceAll('blue', '#5555FF').replaceAll('green', '#55FF55').replaceAll('aqua', '#55FFFF').replaceAll('red', '#FF5555').replaceAll('light_purple', '#FF55FF').replaceAll('yellow', '#FFFF55').replaceAll('reset', '#AAAAAA'),
                            // only add font-weight: bold if the text is bold
                            "font-weight": part.bold ? 'bold' : "",
                            // only add font-style: italic if the text is italic
                            "font-style": part.italics ? 'italic' : "",
                            // only add text-decoration: underline if the text is underlined and strikethrough if the text is strikethrough
                            "text-decoration": [part.underlined ? 'underline' : undefined, part.strikethrough ? 'line-through' : undefined]
                        }
                    };
                });
            });
        }

        description = JSON.stringify(description);

        const pythonProcess = spawn('python3', ['motd-to-img/toimage.py', description]);

        let imageStr = "";

        pythonProcess.stdout.on('data', (data) => {
            imageStr += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(data.toString());
        });

        pythonProcess.stdout.on('end', () => {
            // Remove newlines and whitespace from the beginning and end of the string
            imageStr = imageStr.trim();

            // return a buffer of the image
            resolve(Buffer.from(imageStr, 'base64'));
        });
    });
};