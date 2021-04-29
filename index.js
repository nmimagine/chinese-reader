const fs = require("fs");

// ATLAS EXTRACTOR
// fs.readFile("cedict.txt", "utf8", (err, dictionary) => {
//     let dictionary_items = dictionary.split(/\r?\n/g);
    
//     let writeStream = fs.createWriteStream('atlas.txt');
//     for(const item of dictionary_items)
//     {
//         if(!item.match(/^\#/))
//         writeStream.write(parse_dictionaryItem(item), "utf-8");
//     }
//     writeStream.on('finish', () => {
//         console.log('done');
//     });
    
//     writeStream.end();
// });

// function parse_forAtlas(item)
// {

//     const {meaning, meaning_stripped} = get_meaning(item);
//     const {pinyin, pinyin_stripped} = get_pinyin(meaning_stripped);

//     const character_infos = pinyin_stripped.split(" ");

//     // clean up
//     const traditional = remove_mid_dot(character_infos[0]);
//     const simplified = remove_mid_dot(character_infos[1]);


//     return traditional + "," + simplified + ";";

// }


//SORTED EXTRACTOR
// fs.readFile("dictionaries/cedict.txt", "utf8", (err, dictionary) => {
//     let dictionary_items = dictionary.split(/\r?\n/g);

//     let list = [];
//     let type = 1; // 1=traditional, 2=simplified
//     for(const item of dictionary_items)
//     {
//         if(!item.match(/^\#/))
//         {
//             let parsed = parse_forSorted(item);
//             let len = parsed[0];
//             // if there is already a list for this character length
//             if(!list[len])
//             {
//                 list[len] = [];
                
//             }

//             // list[len].push(parsed[type]);
//             list[len].push([parsed[1], parsed[2]]);
//         }
//     }
    
//     list.reverse();

//     let writeStream = fs.createWriteStream(`dictionaries/sorted_dictionary.txt`);
//     for(const group of list)
//     {
//         if(group)
//         {
//             for(const groupItem of group)
//             {   
//                 writeStream.write(groupItem.join(",") + ";", "utf-8");
//             }
            
//         }
//     }
//     writeStream.on('finish', () => {
//         console.log('done');
//     });
    
//     writeStream.end();
// });
// function parse_forSorted(item)
// {
//     const {meaning, meaning_stripped} = get_meaning(item);
//     const {pinyin, pinyin_stripped} = get_pinyin(meaning_stripped);

//     const character_infos = pinyin_stripped.split(" ");
//     const traditional = character_infos[0];
//     const simplified = character_infos[1];
//     const traditional_clean = remove_mid_dot(traditional);
//     const simplified_clean = remove_mid_dot(simplified);

//     const char_len = traditional_clean.length;

//     return [char_len, traditional_clean, simplified_clean];
// }

var middot_u = /\u00B7/g;
var middot_entity = "&middot;"
fs.readFile("dictionaries/cedict.txt", "utf8", (err, dictionary) => {
    let dictionary_items = dictionary.split(/\r?\n/g);

    let list = [];
    for(const item of dictionary_items)
    {
        if(!item.match(/^\#/))
        {
            // let chars = get_pinyin(get_meaning(item).meaning_stripped).pinyin_stripped.split(" ")[0]
            // let len = chars.length;

            let parsed = parse_dictionaryItem(item);
            let len = parsed[0];


            // if there is already a list for this character length
            if(!list[len])
            {
                list[len] = [];
                
            }
            
            list[len].push(parsed[1]);
            // list[len].push(item);
        }
    }

    let reversed_list = [];
    for(let i = list.length-1; i > -1; i--)
    {
        if(list[i])
            reversed_list.push(list[i]);
    }
    list = reversed_list;

    let dict = {
        cedict: []
    }
    // let new_cedict = ""
    for(const group of list)
    {
        if(group)
        {
            for(const groupItem of group)
            {   
                dict.cedict.push(groupItem);
                // new_cedict += groupItem + "\n";
            }
            
        }
    }
    
    
    fs.writeFile("dictionaries/cedict.json", JSON.stringify(dict), err => console.error(err));
    // fs.writeFile("dictionaries/cedict_reversed.txt", new_cedict, err => console.error(err))
});
function parse_dictionaryItem(item)
{
    const {meaning, meaning_stripped} = get_meaning(item);
    let {pinyin, pinyin_stripped} = get_pinyin(meaning_stripped);

    const character_infos = pinyin_stripped.split(" ");
    const traditional = character_infos[0];
    const simplified = character_infos[1];
    pinyin = remove_mid_dot(pinyin);
    
    const toned_pinyin = tone_pinyin(pinyin);
    const traditional_html = remove_mid_dot(traditional, true);
    const simplified_html = remove_mid_dot(simplified, true);
    const real_pinyin = toned_pinyin.pinyin;
    const tone = toned_pinyin.tone;
    const processed_meaning = process_meaning(meaning);

    return [
        traditional_html.length,
        {
        traditional: traditional_html,
        simplified: simplified_html,
        pinyin: real_pinyin,
        tone: tone,
        meaning: processed_meaning
        }
    ];
}

function get_meaning(string)
{
    try {
        const meaning = string.match(/\/(.*)\//);
        const meaning_stripped = string.replace(meaning[0], "");

        return {
            meaning: meaning[1], 
            meaning_stripped: meaning_stripped
        }
    } catch(err) {
        console.log(string);
    }
}
function process_meaning(meaning)
{
    const pinyin_regex = /\[(\w+\:?[1-5]\s?)+\]/g;

    // check if it has pinyin
    let matched_pinyin = meaning.match(pinyin_regex);
    if(matched_pinyin)
    {
        let pinyin = get_pinyin(matched_pinyin[0].match(pinyin_regex)[0]).pinyin;
        let toned_pinyin = tone_pinyin(pinyin).pinyin;
        
        let meaning_withpinyin = meaning.replace(pinyin_regex, " " + toned_pinyin);
        meaning = meaning_withpinyin;
    }

    let broken_meaning = meaning.split(/\//g);

    return broken_meaning;
}
function get_pinyin(string)
{
    const pinyin = string.match(/\[(.*)\]/);
    const pinyin_stripped = string.replace(pinyin[0], "");
    return {
        pinyin: pinyin[1], 
        pinyin_stripped: pinyin_stripped
    };
}

function tone_pinyin(pinyin)
{
    let pinyin_output = [];
    let tone = [];
    const syllables = pinyin.split(" ");

    for(let i = 0; i < syllables.length; i++)
    {
        let syl = syllables[i];

        if(syl !== "")
        {
            if(!syl.match(middot_u))
                pinyin_output.push(true_pinyin(syl));

            let tone_number = syl.match(/\d/);
            if(tone_number)
                tone.push(parseInt(tone_number));        
            else
                tone.push(5);
        }
    }

    return {
        pinyin: pinyin_output,
        tone: tone,
    }
}
function true_pinyin(pinyin)
{
    pinyin = pinyin.toLowerCase();
    if(pinyin.match(/[12345]/))
    {
        const tone = parseInt(pinyin.match(/[\d]/)[0]);
        const no_tone = pinyin.replace(tone, "").replace(/u\:/, "v");

        // on "ui" and "iu", tone is placed at the end of the syllable
        if(no_tone.match(/(iu|ui)/))
        {
            const syl_length = no_tone.length;
            const last_character = no_tone.substring(syl_length-1, syl_length);

            const toned = character_to_tone(last_character, tone)

            return no_tone.replace(last_character, toned);
        }
        else
        {
            // vowel order
            const vowel_order = ["a","o","e","i","u","v"];
            // extract vowels
            const vowels = no_tone.match(/[aoeiuv]/);

            // only try to figure out position when there are more than 1 vowels
            if(vowels)
            {
                if(vowels.length == 2)
                {
                    // figure out where to put the tone
                    let winner = vowels[0];
                    
                    let first_position = vowel_order.indexOf(winner);
                    let next_position = vowel_order.indexOf(vowels[1]);

                    // smaller means it comes first
                    if(next_position < first_position)
                    {
                        winner = vowels[1];
                    }

                    // tone the winner
                    let toned = character_to_tone(winner, tone);
                    return no_tone.replace(winner, toned);
                }
                else
                {
                    let toned = character_to_tone(vowels, tone);
                    return no_tone.replace(vowels, toned);
                }
            }
            else
            {
                return no_tone;                
            }

            
        }
    }
    else
    {
        return pinyin;
    }
}
function character_to_tone(char, tone)
{
    const toneData = {
        a: [257, 225, 462, 224, 97], 
        e: [275, 233, 283, 232, 101],
        i: [299, 237, 464, 236, 105],
        o: [333, 243, 466, 242, 111],
        u: [363, 250, 468, 249, 117],
        v: [470, 472, 474, 476, 252]
    }

    if(toneData.hasOwnProperty(char) && tone < 6 && tone > 0)
        return "&#" + toneData[char][tone-1] + ";";
    else
        return "";
}


function replace_mid_dot(str, arrayOutput = false)
{
    let result = str.replace(middot_u, middot_entity)
    if(arrayOutput)
    {
        result = [];
        for(let i = 0; i < str.length; i++)
        {
            let char = str[i];
            if(char.match(middot_u))   
            {
                char = char.replace(middot_u, middot_entity);
            }      
            result.push(char);
        }
    }
    
    return result;
}
function remove_mid_dot(str, arrayOutput = false)
{
    str = str.replace(middot_u, "");
    let result = str;
    if(arrayOutput)
    {
        result = [];
        for(let i = 0; i < str.length; i++)
        {
            let char = str[i];
            result.push(char);
        }
    }
    
    return result;
}
const sample_string = "羅伯特·佛洛斯特 罗伯特·佛洛斯特 [Luo2 bo2 te4 · Fu2 luo4 si1 te4] /Robert Frost (1874-1963), American poet/"
const parsed = parse_dictionaryItem(sample_string);
console.log(parsed);