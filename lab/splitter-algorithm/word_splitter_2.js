const fs = require("fs");

const sample_sentence = `意思是每件事情，每个时刻，每个地方都要学习。

出自——宋代大儒朱熹的名言。

原文：无一事而不学，无一时而不学，无一处而不学，成功之路也。

译文：没有一件事不在学习，没有一个时刻不在学习，没有一处不在学习，这就是成功的道路。

“朱子读书法”六条，即循序渐进、熟读精思、虚心涵泳、切己体察、着紧用力、居敬持志。这是由朱熹的弟子对朱熹读书法所作的集中概括。

其中循序渐进，包括三层意思：一是读书应该按照一定次序，前后不要颠倒；二是“量力所至而谨守之”；三是不可囫囵吞枣，急于求成。熟读精思即是读书既要熟读成诵，又要精于思考。`;

fs.readFile(`dictionaries/sorted_dictionary.txt`, "utf8", (err, dictionary) => {
    dictionary = dictionary.split(",");

    let beginTime = Date.now();

    let separated = separate_into_words(sample_sentence, dictionary);
    let rearranged = rearrange_words(separated, sample_sentence);

    let endTime = Date.now();
    console.log(rearranged.join(" | "))

    console.log(`Elapsed: ${endTime-beginTime}`);
        
});
function separate_into_words(sentence, dictionary)
{
    let segmented_sentence = [];
    let sentence_copy = sentence;

    // separate non-chinese characters, if any
    let foreign_chars = sentence_copy.match(/[\r?\n\s\，\！\@\#\￥\%\…\&\*\（\）\—\-\=\+\【\】\{\}\、\|\：\；\‘\“\，\。\、\《\》\？\\\/\w]/g);
    if(foreign_chars)
    {
        for(let char of foreign_chars)
        {
            segmented_sentence.push(char);
            sentence_copy = sentence_copy.replace(char, "");
        }
    }

    // split sentence into segments
    function addSegment(word)
    {
        // make sure it REALLY is still in the sentence
        if(sentence_copy.includes(word))
        {
            segmented_sentence.push(word);
            // remove word from the sentence copy
            // so it won't confuse the algorithm
            sentence_copy = sentence_copy.replace(word, "");
        }
           
    }
    for(let i = 0; i < dictionary.length; i++)
    {
        let word = dictionary[i];
        if(sentence_copy.includes(word))
        {
            addSegment(word);

            // check if there are more instance of the same word
            let other_instances = sentence_copy.match(new RegExp(word, "g"));
            if(other_instances)
            {
                for(let instance of other_instances)
                {
                    addSegment(instance);
                }
            }
            
            if(sentence_copy == "")
                break;
        }
        
        
    }

    return segmented_sentence;
}

function rearrange_words(segmented_sentence, original_sentence)
{
    // fs.writeFileSync("segmented_sentence.txt", segmented_sentence.join(", "), (err)=>console.error(err));
    segmented_sentence = segmented_sentence.sort((a, b) => {
        return b.length-a.length
    });

    let sentence_copy = original_sentence;
    let arranged_sentence = [];

    let still_arranging = true;
    let segments_count = segmented_sentence.length;

    while(still_arranging)
    {        
        arrange_word_step();
        if(arranged_sentence.length == segments_count)
        {            
            still_arranging = false;            
        }
    }

    // arrangement process
    // separated so it can break loop
    // without breaking the main while loop
    function arrange_word_step()
    {
        let found = false;
        let segment;
        for(let i = 0; i < segmented_sentence.length; i++)
        {
            segment = segmented_sentence[i];
            let first_word = new RegExp(`^${segment}`);
            if(sentence_copy.match(first_word))
            {
                arranged_sentence.push(segment);

                sentence_copy = sentence_copy.replace(first_word, "");
                
                segmented_sentence.splice(i, 1);
                
                found = true;
                break;
            }            
        }

        // if(!found)
        // {
        //     console.log(sentence_copy);
        //     console.log("===")
        // }
        
    }

    return arranged_sentence;
}