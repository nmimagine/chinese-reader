const fs = require("fs");

const sample_sentence = `常用成语示例：
喜从天降
马到成功
生龙活虎
落落大方
含情脉脉
心平气和
谈笑风生
安邦定国`;
// const sample_sentence = `意思是每件事情，每个时刻，每个地方都要学习。`;
fs.readFile(`dictionaries/sorted_dictionary.txt`, "utf8", (err, dictionary) => {
    dictionary = dictionary.split(",");

    let beginTime = Date.now();

    let separated = separate_into_words(sample_sentence, dictionary);
    // let rearranged = rearrange_words(separated, sample_sentence);

    let endTime = Date.now();
    console.log(separated.join(" | "))

    console.log(`Elapsed: ${endTime-beginTime}`);
        
});

function separate_into_words(sentence, dictionary)
{
    let segmented_sentence = [];
    let sentence_copy = sentence;

    // separate non-chinese characters, if any
    let foreign_chars = /[\r?\n\s\，\！\@\#\￥\%\…\&\*\（\）\—\-\=\+\【\】\{\}\、\|\：\；\‘\“\”\。\、\《\》\？\\\/\w]/;
    
    let char_count = 0;
    let word_found = false;
    let previous_word = "";

    let iteration = 0;
    while(sentence_copy !== "")
    {
        let word_chunk = sentence_copy.substring(0, char_count);

        // cut it if there's a foreign character
        let foreign_match = word_chunk.match(foreign_chars);
        if(foreign_match)
        {
            // if the foreign character is the first character
            if(foreign_match.index == 0)
            {                
                let char = foreign_match[0];
                add_segment(char);      
                continue;          
            }
            else
            {
                // you might worry if there will be any other foreign characters
                // inside this newly cut word chunk
                // but we didn't assign a global flag on the regex
                // so we're good (I think)
                word_chunk = word_chunk.substring(0, foreign_match.index);

                char_count = foreign_match.index;
                                

            }
        }

        if(dictionary.indexOf(word_chunk) != -1)
        {
            if(!word_found)
            {
                // let's try a bit more
                // if no foreign char
                if(!foreign_match)
                {
                    word_found = true;
                    previous_word = word_chunk;
                    char_count++;
                    
                }
                else
                {
                    add_segment(word_chunk)
                }
            }
            else
            {
                // sweet
                // but let's try a bit more again
                // if there's no foreign char
                if(foreign_match)
                {
                    add_segment(previous_word);  
                }
                else
                {
                    // try for more
                    // if there are still words left after it
                    if(word_chunk.length == sentence_copy.length)
                    {
                        add_segment(word_chunk)
                    }
                    else
                    {
                        previous_word = word_chunk;
                        char_count++;
    
                    }
                }
                
            }
        }
        else
        {
            // word is found on previous interation
            // so we use that, and carry on
            if(word_found)
            {
                add_segment(previous_word);                      
            }
            else
            {
                char_count++;
            }
        }
        iteration++;
    }

    function add_segment(characters)
    {
        segmented_sentence.push(characters);
        sentence_copy = sentence_copy.replace(new RegExp(`^${characters}`), "");
        char_count = 0;
        previous_word = "";
        word_found = false;
    }
    return segmented_sentence;
}