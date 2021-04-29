const fs = require("fs");

const sample_sentence = `【原神】（ Genshin impact）
今年最受期待的全新手遊！
臉書非官方討論區正式開啟！
［入社請務必回答三個入社問題］
［社團貼文主題區塊有很多攻略可用］
歡迎各位旅行者的加入呦(*´∀｀)/
我是社長時崎管管，請多指教！`;
// const sample_sentence = `意思是每件事情，每个时刻，每个地方都要学习。`;
fs.readFile(`dictionaries/sorted_dictionary.txt`, "utf8", (err, dictionary) => {
    if(err)
    {
        console.log(err);
        return;
    }
    dictionary = dictionary.split(",");

    let beginTime = Date.now();

    let separated = separate_into_words(sample_sentence, dictionary);

    let endTime = Date.now();
    console.log(separated.join(" | "))

    console.log(`Elapsed: ${endTime-beginTime}`);
        
});
function separate_into_words(sentence, dictionary)
{
    let segmented_sentence = [];
    let sentence_copy = sentence;

    // separate non-chinese characters, if any
    // let foreign_chars = /[\r?\n\s\，\∀\！\@\#\￥\%\…\&\*\（\）\—\-\=\+\【\】\{\}\、\|\：\；\‘\“\”\。\、\《\》\？\\\/\［\］\´\｀\(\)\w]/;
    let foreign_chars = /[^\u4E00-\u9FA5]/;
    let no_escape = /[\w\d\s\r\n]/;
    
    let start_char_count = 20;
    let char_count = start_char_count;

    while(sentence_copy !== "")
    {
        
        let word_chunk = sentence_copy.substring(0, char_count);
        
        if(dictionary.indexOf(word_chunk) !== -1)
        {
            add_segment(word_chunk); 
        }
        else
        {
            // cut it if there's a foreign character
            let foreign_match = word_chunk.match(foreign_chars);
            if(foreign_match)
            {
                
                // if the foreign character is the first character
                if(foreign_match.index == 0)
                {                
                    let char = foreign_match[0];
                    if(!char.match(no_escape))
                        add_segment("\\"+char);      
                    else
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

            if(dictionary.indexOf(word_chunk) !== -1)
            {
                
                add_segment(word_chunk)
                        
            }
            else
            {
                char_count--;
            }
        }

        
    }

    function add_segment(characters)
    {
        segmented_sentence.push(characters);
        sentence_copy = sentence_copy.replace(new RegExp(`^${characters}`), "");
        console.log(characters)
        char_count = start_char_count;
    }

    
    return segmented_sentence;
}