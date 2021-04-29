ChineseReader.separate_into_words(sentence, dictionary)
{
    let segmented_sentence = [];
    let sentence_copy = sentence;

    // separate non-chinese characters, if any
    let foreign_chars = /[\r?\n\s\，\！\@\#\￥\%\…\&\*\（\）\—\-\=\+\【\】\{\}\、\|\：\；\‘\“\”\。\、\《\》\？\\\/\w]/;

    
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
        char_count = start_char_count;
    }

    
    return segmented_sentence;
}