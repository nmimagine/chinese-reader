// fetch the database
// it's big so only load and parse it once
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        // load template
        if(!document.querySelector(".chread-modal"))
        {
            fetch(chrome.runtime.getURL('templates/app.html')).then(r => r.text()).then(html => {
                console.log("ChineseReader loaded")
                document.body.insertAdjacentHTML('beforeend', html);
                // bind modal event for closing
                let tryBindModal = function()
                {
                    let modal = document.querySelector(".chread-modal");
                    if(modal)
                    {
                        modal.addEventListener("click", function(){
                            
                            if(modal.classList.contains("chread-hidden"))
                                modal.classList.remove("chread-hidden")
                            else
                                modal.classList.add("chread-hidden")

                            ChineseReader.removeFloaty();
                        });
                        
                        modal.classList.add("chread-hidden");
                    }
                    else
                    {
                        setTimeout(tryBindModal, 500);
                    }
                }
                tryBindModal();
            }).catch(err => console.log(err))
        }
        ChineseReader.setup(request);
        
    }
);
var ChineseReader = {};
ChineseReader.dictionary_sorted = [];
ChineseReader.dictionary_atlas = [];
ChineseReader.dictionary_loaded = false;
ChineseReader.setup = function(dictionary)
{    
    // settings
    this.character_mode = "simplified"

    // for storing processed sentences
    this.sentences = [];

    // current sentence
    this.sentence_index = 0;

    // still quite many THICC variables right here
    // this is the most efficient way I can do it
    // at least it only need 2 files
    this.dictionary = dictionary.dictionary;
    this.atlas = dictionary.atlas;
    this.atlas_array = dictionary.atlas_array;
    this.lookup = dictionary.lookup; 

    // statuses
      this.dictionary_loaded = true;
    this.control_loaded = false;
    
    this.findSelection();    
    
}
window.addEventListener("mouseup", function(event){
    let floatContainer = document.querySelector(".chread-floatwrapper");
    if(floatContainer.classList)
        floatContainer.classList.add("chread-hidden")
    
    ChineseReader.findSelection(event);
});
ChineseReader.findSelection = function(event)
{

    let selected = window.getSelection();
    let selectedText = selected.toString();
    
    if(selectedText !== "")
    {
        
        // only show the button if there're chinese characters
        let chinese_regex = /[\u4E00-\u9FA5]/g
        if(selectedText.match(chinese_regex))
        {
            if(selectedText.length <= 4)
            {
                let sentenceContainer = document.querySelector(".chread-floatwrapper"); 
                sentenceContainer.classList.remove("chread-hidden");
                sentenceContainer.querySelector(".chread-panelcontent").innerHTML = "";
                let sentenceBox = sentenceContainer.getBoundingClientRect();
                
                let selectBox = selected.getRangeAt(0).getBoundingClientRect();
                x = selectBox.x + (selectBox.width-sentenceBox.width) / 2; 
                y = window.scrollY + selectBox.y + selectBox.height + 10;
                
                sentenceContainer.style.left = x + "px";
                sentenceContainer.style.top = y + "px"; 
              ChineseReader.getText(true);
            }
            else
            {
                let floaty = ChineseReader.hasFloaty();
                if(!floaty)
                {
                    floaty = new ElementBuilder({
                        tag: "div",
                        class: "chread-floaty",
                        html: "HELP ME I CAN'T READ",
                        events: {
                            click: function()
                            {
                                ChineseReader.getText();
                            }
                        }
                    });
                    floaty.appendTo(document.body);
                    floaty = floaty.element;
                }
                ChineseReader.positionFloaty(selected, floaty, event);
            }
            
        }
    } 
    else
    {
        ChineseReader.removeFloaty();
    }
}
ChineseReader.removeFloaty = function()
{
    let floaties = document.querySelectorAll(".chread-floaty");
    if(floaties)
    {
        for(let floaty of floaties)
        {
            document.body.removeChild(floaty);
        }
    }
}
ChineseReader.hasFloaty = function()
{
    return document.querySelector(".chread-floaty");
}
ChineseReader.positionFloaty = function(selection, floaty_el, event)
{
    let y = 0;
    let x = 0;
    let googtrans_icon = document.getElementById("gtx-trans");
    if(googtrans_icon)
    {
        let goog_box = googtrans_icon.getBoundingClientRect();
        let float_box = floaty_el.getBoundingClientRect();
        x = goog_box.x - float_box.width;
        y = goog_box = y;
    }
    else
    {
        if(event)
        {
            x = event.clientX;
            y = event.clientY;
        }
        else
        {
            let selectBox = selection.getRangeAt(0).getBoundingClientRect();
            x = selectBox.x + 10 + selectBox.width;
            y = selectBox.y;
          }
    }
    floaty_el.style.left = x + "px";
    floaty_el.style.top = y + "px"
}
ChineseReader.getText = function(small = false)
{
    if(this.dictionary_loaded)
    {

        let selected_text = window.getSelection().toString();
        let sentences = selected_text.split(/\u3002|\r?\n/g);

        this.sentences = [];
        let sentenceContainer = document.querySelector(".chread-floatwrapper"); 
        if(small)
        {

            let exploded = this.explode_sentence({
                original: selected_text,
                exploded: []
            })
            this.displayCharacters(exploded, true);
        }
        else
        {
            document.querySelector(".chread-modal").classList.remove("chread-hidden");
            sentenceContainer = document.querySelector(".chread-rightpanel");
            sentenceContainer.innerHTML = "";
            // remove blank entry
            if(sentences.indexOf("") !== -1)
            {
                while(sentences.indexOf("") !== -1)
                {
                    let blank = sentences.indexOf("");
                    sentences.splice(blank, 1);
                }
            }
            
            // add to array
            let sentenceElements = [];
            let index = 0;
            let first = true;
            for(let sentence of sentences)
            {
                sentenceElements.push(ChineseReader.chineseSentence(sentence, index))
                this.sentences.push(
                    {
                        original: sentence,
                        exploded: []
                    }
                )

                if(index == 0)
                    ChineseReader.process_sentence(index)
                index++;
            }

            ElementBuilder.generate(sentenceElements, sentenceContainer);
        } 
        
    }
    else
    {
        alert("non")
    }
        

        
     
        
}
ChineseReader.explode_sentence = function(sentence)
{
    if(sentence && sentence.exploded.length === 0)
    {
        let separated_text = this.separate_into_words(sentence.original);

        let result = [];
        for(const character of separated_text)
        {
            let character_index = this.get_dictionaryIndex(character);
            if(character_index.length > 1)
            {
                let data = [];
        
                for(let index of character_index)
                {
                    data.push(this.dictionary.cedict[index])
                }
                result.push(data);
            }
            else
            {
                if(character_index[0] !== -1)
                {
                    result.push(this.dictionary.cedict[character_index[0]]);
                }
                else
                {
                    result.push(character);
                }
            }
        }
        return result;
    } 
    else if (!sentence)
    {
        console.log("ChineseReader: sentence doesn't exist. The following is the stored data:")
        console.log(ChineseReader.sentences);
        return [];
    }
    else if(sentence.exploded.length > 0)
    {
        return sentence.exploded
    }
}
ChineseReader.separate_into_words = function(sentence)
{
    let segmented_sentence = [];
    let sentence_copy = sentence;

    // for separating non-chinese-characters, if any
    let foreign_chars = /[^\u4E00-\u9FA5]/;

    // characters that shouldn't be escaped
    let no_escape = /[\w\d\s\r\n]/;
    
    // 20 is the biggest amount of characters in the dictionary
    // we shouldn't be iterating 20 times for each words 
    let start_char_count = 20;
    let char_count = start_char_count;

    while(sentence_copy !== "")
    {
        
        let word_chunk = sentence_copy.substring(0, char_count);
        
        if(this.isInDictionary(word_chunk))
        {
            add_segment(word_chunk, this); 
        }
        else
        {   
            // cut the sentence if there's a foreign character
            let foreign_match = word_chunk.match(foreign_chars);
            if(foreign_match)
            {
                
                // if the foreign character is on the first character
                if(foreign_match.index == 0)
                {            
                    let char = foreign_match[0];
                    if(!char.match(no_escape))
                        add_segment("\\"+char, this);      
                    else
                        add_segment(char, this);        
                    continue;          
                }
                else
                {
                    // cut the word-only part
                    word_chunk = word_chunk.substring(0, foreign_match.index);

                    char_count = foreign_match.index;                                    
                }
            }

            if(this.isInDictionary(word_chunk))
            {                
                add_segment(word_chunk, this)                        
            }
            else
            {
                // just in case it reaches 1 without finding match
                // drop a little love letter for the dev (me)
                if(char_count == 1)
                {
                    console.log("reaches 1 without finding a match");
                    console.log(`character is: ${word_chunk}`);
                    add_segment(word_chunk, this);
                }
                else
                {
                    char_count--;
                }
            }
        }

        
    }

    function add_segment(characters, dis)
    {
        /* 
        for some reason, searching dictionary now
        will slow things down

        it's faster if we separate the process

        weird
        */
        segmented_sentence.push(characters);
        let regex = (characters == "\\n") ? new RegExp(`${characters}`) : new RegExp(`^${characters}`);
        sentence_copy = sentence_copy.replace(regex, "");
        char_count = start_char_count;
    }

    
    return segmented_sentence;
}
ChineseReader.isInDictionary = function(word)
{
    return this.lookup.indexOf(word) !== -1
}
ChineseReader.get_dictionaryIndex = function(char)
{
    /* 
    the regex for each entry in atlas

    format: traditional,simplified;

    we are extracting both from the atlas, 
    using just 1 kind of character (traditional or simplified)
     */
    let atlas_entry_regex = new RegExp(`\;.{1,${char.length}}\,${char}(?=\;)|\;${char}\,.{1,${char.length}}(?=\;)`, "g");

    // copy the atlas because we're be marking stuff
    // to prevent copy
    let atlas_array_copy = this.atlas_array.slice();

    // get the word in the atlas
    let dict_index = [];
    while((word_position = atlas_entry_regex.exec(this.atlas)) !== null)
    {
        
        // extract the entry without the semicolons
        let word_start_position = word_position.index + 1;
        let word_end_position = word_start_position + word_position[0].length-1;
        let entry = this.atlas.substring(word_start_position, word_end_position);
        let word_index = atlas_array_copy.indexOf(entry);
        dict_index.push(word_index);

        // mark added word so to prevent the program keep adding the same word
        atlas_array_copy[word_index] = "//////";
    }
    if(dict_index.length === 0)
    {
        dict_index = [-1];
    }

    
    return dict_index;

   
}

ChineseReader.displayCharacters = function(sentence_data, smol = false)
{
    
    if(sentence_data)
    {
        let word_container = document.querySelector(".chread-leftpanel .chread-panelcontent .chread-words-container");
        if(smol)
            word_container = document.querySelector(".chread-floatwrapper .chread-panelcontent");
        word_container.innerHTML = "";

        let word_elements = [];
        for(let word of sentence_data)
        {
            if(typeof(word) === "object")
            {
                
                
                let mean = [];
                let smol_handled = false;
                if(Array.isArray(word))
                {
                    if(smol)
                    {
                        for(const w of word)
                        {
                            let m = w.meaning;
                            word_elements.push(ChineseReader.chineseWord(w, m, smol))
                        }
                        smol_handled = true;
                    }
                    else
                    {
                        mean = word[0].meaning;
                    }
                }
                else
                {
                    mean = word.meaning;
                }

                if(!smol_handled)
                {
                    let meaning = mean.join(", ");
                    word_elements.push(ChineseReader.chineseWord(word, meaning, smol))
                }
            } 
            else
            {
                if(typeof(word) === "string" || typeof(word) === "number")
                {
                    word = word.replace(/\\/, "")
                    let char_element = [this.chineseCharacter(word, word, 5)];

                    word_elements.push(ChineseReader.chineseWord(word, word, smol))
                }
            }
        }

        ElementBuilder.generate(word_elements, word_container)

        // generate control if not already
        if(!this.control_loaded && !smol)
        {
            this.load_control();
        }
    }
    else
    {
        console.log("ChineseReader: no data to display")
    }
}

let checkbox = function(label, onchange = function(){}, checked = false)
{
    let id = "chr-id-"+label.toLowerCase().replace(/\s/g, "");
    return [
        {
            tag: "input",
            type: "checkbox",
            class: "chread-input",
            id: id,
            events: {
                change: onchange
            },
            checked: checked
        },
        {
            tag: "label",
            for: id,
            class: "chread-inputgap",
            html: label
        }
    ]
}
let toggleButton = function(values, onchange, defaultIndex = 0)
{
    return [{
        tag: "button",
        html: values[defaultIndex],
        class: "chread-charswitch",
        events: {
            click: function(e)
            {
                let thisElement = e.target;
                let currentIndex = values.indexOf(thisElement.innerHTML);

                if(currentIndex == values.length-1)                
                    currentIndex = 0;            
                else
                    currentIndex++;
                thisElement.innerHTML = values[currentIndex];
                    
                onchange(values[currentIndex]);
            }
        }
    }]
}
ChineseReader.load_control = function()
{
    let control_scheme = [
        ...checkbox("Separate Words", function(e){
            ChineseReader.container_class_toggler("chread-word-separated", e)
        }, true),
        ...checkbox("Show Pinyin", function(e){            
            ChineseReader.container_class_toggler("chread-showpinyin", e)
        }),
        ...checkbox("Colorize Pinyin", function(e){
            ChineseReader.container_class_toggler("chread-colortone", e)
            
        }),
        ...toggleButton(["Simplified", "Traditional"], (newValue) => {
            ChineseReader.character_mode = newValue.toLowerCase();
            let sentence_data = ChineseReader.sentences[ChineseReader.index];
           
            if(sentence_data.exploded.length === 0)
                sentence_data.exploded = ChineseReader.explode_sentence(sentence_data);

            ChineseReader.displayCharacters(sentence_data.exploded);
        })
    ]
    ElementBuilder.generate(control_scheme, document.querySelector(".chread-settings"));
    // console.log(control_scheme)
    ChineseReader.control_loaded = true;
}
ChineseReader.container_class_toggler = function(className, event)
{
    let isChecked = event.target.checked;
    let container = document.querySelector(".chread-words-container");

    if(isChecked)
    {
        if(!container.classList.contains(className))
            container.classList.add(className)
    }
    else
    {
        container.classList.remove(className);
    }
}
// UI
ChineseReader.reset_sentenceHighlight = function()
{
    let sentence_elements = document.querySelectorAll(".chread-sentence")
    if(sentence_elements)
    {
        for(let sentence of sentence_elements)
        {
            sentence.classList.remove("chread-sentence-selected");
        }
    }
}
ChineseReader.chineseSentence = function(sentence, index)
{
    let selected_class = (index === 0) ? " chread-sentence-selected" : "";
    return {
        tag: "div",
        class: "chread-sentence" + selected_class,
        html: sentence,
        events: {
            click: function(e)
            {                
                ChineseReader.process_sentence(index, this);
            }
        }
    }
}
ChineseReader.process_sentence = function(index, el)
{
    this.index = index;

    let sentence_data = ChineseReader.sentences[index];
    sentence_data.exploded = ChineseReader.explode_sentence(sentence_data);
    ChineseReader.displayCharacters(sentence_data.exploded);

    ChineseReader.reset_sentenceHighlight();

    if(el)
    el.classList.add("chread-sentence-selected")
}
ChineseReader.chineseWord = function(word, meaning, smol = false, alt = false, selected = false)
{
    let characters = [];
    let meaning_element = {
        tag: "div",
        class: "chread-meaning-container",
        children: [
            {
                tag: "div",
                class: "chread-meaning",
                html: meaning
            }
        ]
    }
    if(alt)
        meaning_element = {
            tag: "div",
            class: "chread-meaning",
            html: meaning
        }
    if(typeof(word) === "object" && !Array.isArray(word))
    {
        for(let i = 0; i < word.traditional.length; i++)
        {
            let char_element = this.create_charElement(word, i)
            characters.push(char_element);
        }
    } 
    else if(typeof(word) == "string")
    {
        characters = [this.chineseCharacter(word, word, 5)];
    }
    else if(Array.isArray(word))
    {
        // display the top result
        for(let i = 0; i < word[0].traditional.length; i++)
        {
            let char_element = this.create_charElement(word[0], i)
            characters.push(char_element);
        }
        let alts = []
        let first = true;
        for(const w of word)
        {

            alts.push(ChineseReader.chineseWord(w, w.meaning.join(", "), smol, true, first))
            first = false;
        }

        meaning_element = {
            tag: "div",
            class: "chread-meaning-container",
            children: alts
        }
    }
    return {
        tag: "div",
        class: (alt) ? ((selected) ? "chread-alt-word chread-alt-word-selected" : "chread-alt-word") : "chread-word",
        children: [
            {
                tag: "div",
                class: "chread-characters-container",
                children: characters
            },
            meaning_element
        ],
        ...(alt && !smol) ? {
            events: {
                click: function(e)
                {
                    let mainword_container = this.parentElement.parentElement.firstChild;
                    let replacement = this.firstChild;

                    mainword_container.innerHTML = replacement.innerHTML;

                    // highlight change
                    let selected_class = "chread-alt-word-selected";
                    for(let option of this.parentElement.querySelectorAll(".chread-alt-word"))
                    {
                        if(option == this)
                        {
                            if(!option.classList.contains(selected_class))
                            {
                                option.classList.add(selected_class)
                            }
                        } 
                        else 
                        {
                            option.classList.remove(selected_class);
                        }
                    }
                }
            }
        } : {}
    }
}
ChineseReader.create_charElement = function(word, i)
{
    let character = word[this.character_mode][i];
    let pinyin = word.pinyin[i];
    let tone = word.tone[i];

    let char_element = this.chineseCharacter(character, pinyin, tone);

    return char_element
}
ChineseReader.chineseCharacter = function(hanzi, pinyin, tone)
{
    return {
        tag: "div",
        class: "chread-character chread-tone-" + tone,
        children: [
            {
                tag: "div",
                class: "chread-hanzi",
                html: hanzi
            },
            {
                tag: "div",
                class: "chread-pinyin",
                html: pinyin
            }
        ]
    }
}


// ElementBuilder
"use strict";function _typeof(e){return(_typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function _createForOfIteratorHelper(e,t){var n;if("undefined"==typeof Symbol||null==e[Symbol.iterator]){if(Array.isArray(e)||(n=_unsupportedIterableToArray(e))||t&&e&&"number"==typeof e.length){n&&(e=n);var r=0,i=function(){};return{s:i,n:function(){return r>=e.length?{done:!0}:{done:!1,value:e[r++]}},e:function(e){throw e},f:i}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var a,l=!0,o=!1;return{s:function(){n=e[Symbol.iterator]()},n:function(){var e=n.next();return l=e.done,e},e:function(e){o=!0,a=e},f:function(){try{l||null==n.return||n.return()}finally{if(o)throw a}}}}function _unsupportedIterableToArray(e,t){if(e){if("string"==typeof e)return _arrayLikeToArray(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?_arrayLikeToArray(e,t):void 0}}function _arrayLikeToArray(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function _defineProperties(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}function _createClass(e,t,n){return t&&_defineProperties(e.prototype,t),n&&_defineProperties(e,n),e}var ElementBuilder=function(){function h(e){var t,n,r=1<arguments.length&&void 0!==arguments[1]?arguments[1]:document;if(_classCallCheck(this,h),r instanceof Document==0)return console.error("ElementBuilder: Invalid document variable in constructor."),!1;if(this.children=[],this._isCollectiveElement=!1,!Array.isArray(e)){for(var i in e)if(e.hasOwnProperty(i)){var a=e[i];switch(i){case"tag":t=r.createElement(a);break;case"events":for(var l in a)t.addEventListener(l,a[l]);break;case"html":t.innerHTML=a;break;case"children":case"style":break;default:t.setAttribute(i,a)}}if(this.element=t,!e.hasOwnProperty("style")||"object"===_typeof(n=e.style)&&this.style(n),e.hasOwnProperty("children")){var o=e.children;if(Array.isArray(o)){var s,c=_createForOfIteratorHelper(o);try{for(c.s();!(s=c.n()).done;){var f=s.value;this.children.push(new h(f,r).appendTo(this.element))}}catch(e){c.e(e)}finally{c.f()}}else"object"==_typeof(o)&&this.children.push(new h(o,r).appendTo(this.element))}return this}t=[];var u,y=_createForOfIteratorHelper(e);try{for(y.s();!(u=y.n()).done;){var p=u.value;t.push(new h(p,r))}}catch(e){y.e(e)}finally{y.f()}this.element=t,this.children=t,this._isCollectiveElement=!0}return _createClass(h,[{key:"each",value:function(e,t){var n=!(1<arguments.length&&void 0!==t)||t;if(Array.isArray(this.element)){var r,i=_createForOfIteratorHelper(this.element);try{for(i.s();!(r=i.n()).done;){var a=r.value;e(a,a.element)}}catch(e){i.e(e)}finally{i.f()}}else if(0<this.children.length){n&&e(this,this.element);var l,o=_createForOfIteratorHelper(this.children);try{for(o.s();!(l=o.n()).done;){var s=l.value;e(s,s.el)}}catch(e){o.e(e)}finally{o.f()}}}},{key:"on",value:function(e,t,n){if("object"==_typeof(e))for(var r in e)this._isCollectiveElement||this.element.addEventListener(r,e[r],t);else this._isCollectiveElement||this.element.addEventListener(e,t,n);return this}},{key:"addClass",value:function(e){return this.element.classList.add(e),this}},{key:"removeClass",value:function(e){return this.element.classList.remove(e),this}},{key:"replaceClass",value:function(e,t){return this.element.classList.replace(e,t),this}},{key:"toggleClass",value:function(){this.element.classList.toggle(classList)}},{key:"append",value:function(e){if(e instanceof h)this.element.appendChild(e.element);else if(Array.isArray(e)){var t,n=_createForOfIteratorHelper(e);try{for(n.s();!(t=n.n()).done;){var r=t.value;this.append(r)}}catch(e){n.e(e)}finally{n.f()}}else h._isElement(e)&&this.element.appendChild(e);return this}},{key:"prepend",value:function(e){if(e instanceof h)this.element.prepend(e.element);else if(Array.isArray(e)){var t,n=_createForOfIteratorHelper(e);try{for(n.s();!(t=n.n()).done;){var r=t.value;this.prepend(r)}}catch(e){n.e(e)}finally{n.f()}}else h._isElement(e)&&this.element.prepend(e);return this}},{key:"appendTo",value:function(e){if(Array.isArray(this.element)){var t,n=_createForOfIteratorHelper(this.element);try{for(n.s();!(t=n.n()).done;){var r=t.value;r instanceof h&&this._appendTo(e,r)}}catch(e){n.e(e)}finally{n.f()}}else this._appendTo(e,this);return this}},{key:"prependTo",value:function(e){if(Array.isArray(this.element)){var t,n=_createForOfIteratorHelper(this.element);try{for(n.s();!(t=n.n()).done;){var r=t.value;r instanceof h&&this._prependTo(e,r)}}catch(e){n.e(e)}finally{n.f()}}else this._prependTo(e,this);return this}},{key:"_appendTo",value:function(e,t){if(e instanceof h)e.append(t);else if("string"==typeof e)document.querySelector(e).appendChild(t.element);else{if(!h._isElement(e))return!1;e.appendChild(t.element)}return!0}},{key:"_prependTo",value:function(e,t){if(e instanceof h)e.prepend(t);else if("string"==typeof e)document.querySelector(e).prepend(t.element);else{if(!h._isElement(e))return!1;e.prepend(t.element)}return!0}},{key:"style",value:function(e,t){if("object"==_typeof(e))for(var n in e)this.element.style.hasOwnProperty(n)&&(this.element.style[n]=e[n]);else if("string"==typeof e){if(!t)return this.element.style[e];this.element.style.hasOwnProperty(e)&&(this.element.style[e]=t)}return this}},{key:"_removeSpace",value:function(e){return e=(e=e.replace(/^\s/,"")).replace(/\s$/,"")}},{key:"el",get:function(){return this.element}},{key:"html",get:function(){return this.element.innerHTML},set:function(e){this.element.innerHTML=e}},{key:"text",get:function(){return this.element.innerText}}],[{key:"_isElement",value:function(e){return"object"===("undefined"==typeof HTMLElement?"undefined":_typeof(HTMLElement))?e instanceof HTMLElement:e&&"object"===_typeof(e)&&null!==e&&1===e.nodeType&&"string"==typeof e.nodeName}},{key:"generate",value:function(e,t,n){var r,i=2<arguments.length&&void 0!==n?n:document;if(i instanceof Document==0)return console.error("ElementBuilder: Invalid document variable in constructor."),!1;if(t=t||i.body,r=new h(e,i),Array.isArray(r.element)){var a,l=_createForOfIteratorHelper(r.element);try{for(l.s();!(a=l.n()).done;){var o=a.value;o instanceof h&&o.appendTo(t)}}catch(e){l.e(e)}finally{l.f()}}else r.appendTo(t)}},{key:"createStyle",value:function(e){e=e.replace(/[\n\t]/g,"").replace(/[ ]{2,}/g,"");var t={element:document.createElement("style"),add:function(e){this.element.innerHTML+=e}};return t.element.innerHTML=e,document.head.appendChild(t.element),t}},{key:"insertProperties",value:function(e,t){for(var n in t){var r;t.hasOwnProperty(n)&&(r=t[n],e.setAttr(n,r))}}}]),h}();
