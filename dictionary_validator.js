const fs = require("fs");

fs.readFile("dictionaries/sorted_dictionary.txt", "utf8", (err, sorted_dictionary) => {
    fs.readFile("dictionaries/cedict.json", "utf8", (err, cedict) => {
        sorted = sorted_dictionary.split(/\;/);
        cedict = JSON.parse(cedict);

        for(let i = 0; i < sorted.length; i++)
        {
            try{
                let sorted_char = sorted[i].split(",")[0];
                let cedict_char = cedict.cedict[i].traditional.join("");
    
                if(sorted_char !== cedict_char)
                {
                    console.log(`INCONSISTENCY DETECTED on line ${i+1}, sorted:${sorted_char} - cedict:${cedict_char}`)
                    break;
                }
            }catch(err){
                console.log(`error, ${sorted[i].split(",")[0]}, index: ${i}/${sorted.length}/${cedict.cedict.length}, data: ${JSON.stringify(cedict.cedict[i])}`)
            }
            
        }
    });
});