
let dictionary_sorted_file = chrome.runtime.getURL("dictionaries/sorted_dictionary.txt");
let cedict_file = chrome.runtime.getURL("dictionaries/cedict.json");

function load_dictionaries() {
    return new Promise((resolve, reject) => {
        fetch(dictionary_sorted_file)
            .then(response => response.text())
            .then(dict_atlas => {
                let lookup = dict_atlas.split(/[\,\;]/);
                fetch(cedict_file)
                .then(response => response.text())
                .then(cedict => {
                    let dict = JSON.parse(cedict);
                    
                    resolve({
                        dictionary: dict,
                        atlas: dict_atlas,
                        atlas_array: dict_atlas.split(/\;/g),
                        lookup: lookup
                    });
                });
            });
    });
}
load_dictionaries().then((dictionary) => {
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if (changeInfo.status == 'complete') {
            chrome.tabs.sendMessage(tabId, dictionary);
        }
    });
    // chrome.fontSettings.getFont(
    //     { genericFamily: 'serif', script: 'Hant' },
    //     function(details) { console.log(details.fontId); }
    //   );
    chrome.storage.sync.get(["options"], function(data) {
        if(!data.options)
        {
            // create new options using default values
            chrome.storage.sync.set({options: {
                separate_words: true,
                show_pinyin: true,
                colorize_pinyin: true,
                character_mode: "simplified"
            }})
        }
    });
    chrome.contextMenus.create({
        title: "Help me read chinese!",
        contexts: ["selection"],
        id: "chinese-reader",
    });
    chrome.contextMenus.onClicked.addListener((clickdata, tab) => {
        if (clickdata.menuItemId == "chinese-reader") {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    ChineseReader.getText();
                },
            });
        }

    });

})


