const fs = require("fs");

fs.readFile("dictionaries/atlas.txt", "utf8", (err, dictionary) => {
    const char = "一日之计在于晨";

    // to extract word from atlas
    // (format: traditional,simplified and separated with ;)
    let regex_small = new RegExp(`\;.{1,6}\,${char}(?=\;)|\;${char}\,.{1,6}(?=\;)`, "g");
    let regex_medium = new RegExp(`\;.{1,10}\,${char}(?=\;)|\;${char}\,.{1,10}(?=\;)`, "g");
    let regex_BIG = new RegExp(`\;.{1,20}\,${char}(?=\;)|\;${char}\,.{1,20}(?=\;)`, "g");

    // get the word in the atlas
    function getPosition(reg)
    {
        let word_position = reg.exec(dictionary);
        let word_start_position = word_position.index + 1;
        let word_end_position = word_start_position + word_position[0].length-1;

        let entry = dictionary.substring(word_start_position, word_end_position);
        let dict_index = dictionary.split(";").indexOf(entry);
        return dict_index;
    }
    
    let pos = -1;
    try {
        pos = getPosition(regex_medium);

        if(pos == -1)
        {
            pos = getPosition(regex_small);
        }
    } catch(err)
    {
        pos = getPosition(regex_BIG);
    }
    
    console.log(pos);
});