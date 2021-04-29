const fs = require("fs");

const sample_sentence = "相信不少人都知道這次公子池又打水漂了";

let traditional_dictionary;
let simplified_dictionary;
fs.readFile(`dictionaries/traditional_sorted.txt`, "utf8", (err, trad_dict) => {
    traditional_dictionary = trad_dict.split(","); 

    fs.readFile(`dictionaries/simplified_sorted.txt`, "utf8", (err, simp_dict) => {
        simplified_dictionary = simp_dict.split(","); 

        let beginTime = Date.now();
        let separated = separate_into_words(sample_sentence, {
            traditional: traditional_dictionary,
            simplified: simplified_dictionary
        });
        let endTime = Date.now();
        console.log(`Elapsed: ${endTime-beginTime}`);
        console.log(separated)
    });
    
});
function separate_into_words(sentence, dictionary)
{
    let segmented_sentence = [];
    let sentence_copy = sentence;
    let using = "both";

    // process step function
    function check_then_add(word)
    {
        if(sentence_copy.includes(word))
        {
            segmented_sentence.push(word);

            // remove word from the sentence copy
            // so it won't confuse the algorithm
            sentence_copy = sentence_copy.replace(word, "");

            // remove first space
            sentence_copy = sentence_copy.replace(/^\s/, ""); 
            
            return true;
        }

        return false;
    }

    // split sentence into segments
    for(let i = 0; i < dictionary.traditional.length; i++)
    {
        if(using === "both")
        {
            let trad = check_then_add(dictionary.traditional[i]);
            let simp = check_then_add(dictionary.simplified[i]);

            if(trad)
                using = "traditional";
            else if(simp)
                using = "simplified"

            if(using !== "both")
                console.log(`Using ${using}`);
        }
        else
        {
            check_then_add(dictionary[using][i]);
        }

        // break loop if there is no word to look up
        if(sentence_copy === "")
        break;
        
    }

    return segmented_sentence;
}

