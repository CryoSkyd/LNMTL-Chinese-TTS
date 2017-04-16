(function() {
    // Global variables
    default_settings = {
        lang: "zh-CN",     // Chinese
        pitch: 1,       // 0 to 2
        rate: 1,        // 0.1 to 10
        volume: 1,      // 0 to 1
        //voice: "Google 普通话（中国大陆）",
        voice: "",
        query: "sentence.original"
    };

    current_settings = {}


    
    
    // Initialization
    document.addEventListener('DOMContentLoaded', function() {
        loadSettings(function afterLoad() {
            // build UI once DOM loaded and settings are fetched
            initializePopup();
        });
    })


    // Wait for voices to be loaded to populate voice selector
    window.speechSynthesis.onvoiceschanged = function(e) {
        updateVoices();
    };

    function updateVoices() {
        var voices = speechSynthesis.getVoices();
        console.log("Found voices: " + voices.length)

        if (current_settings.voice == "") {
            // First time running we'll set default to the first zh-CN
            for (let v of voices) {
                if (v.lang == current_settings.lang) {
                    current_settings.voice = v.name;
                }
            }
        }

        window.voiceDropdown.innerHTML = "";
        for (let v of voices) {
            shouldSelect = false;
            if (current_settings.lang == v.lang && current_settings.voice == v.name) {
                shouldSelect = true;
                console.log("Setting default as " + v.name);
            }
            window.voiceDropdown.options.add(new Option(
                v.name,
                v.lang,
                shouldSelect,
                shouldSelect
            ));
        }
    }

    function initializePopup() {
        // Voices
        updateVoices();
        window.voiceDropdown.onchange = function() {
            current_settings.lang = window.voiceDropdown.value;
            current_settings.voice = window.voiceDropdown.selectedOptions[0].label;
            saveSettings();
        }.bind(this);

        // Pitch
        window.pitchInput.oninput = getInputHandler(window.pitchInput, window.pitchValue);
        window.pitchInput.onchange = getChangeHandler(window.pitchInput, "pitch");
        window.pitchInput.value = current_settings.pitch;
        window.pitchInput.oninput();

        // Rate
        window.rateInput.oninput = getInputHandler(window.rateInput, window.rateValue);
        window.rateInput.onchange = getChangeHandler(window.rateInput, "rate");
        window.rateInput.value = current_settings.rate;
        window.rateInput.oninput();

        // Volume
        window.volumeInput.oninput = getInputHandler(window.volumeInput, window.volumeValue);
        window.volumeInput.onchange = getChangeHandler(window.volumeInput, "volume");
        window.volumeInput.value = current_settings.volume;
        window.volumeInput.oninput();

        function getInputHandler(input, output) {
            return (function() {
                output.value = parseFloat(input.value).toFixed(2);
            })            
        }

        function getChangeHandler(input, settingName) {
            return (function() {
                current_settings[settingName] = input.value;
                saveSettings();
            });
        }


        // Advanced settings
        window.querySelectorInput.value = current_settings.query;
        window.querySelectorInput.onchange = function() {
            current_settings.query = window.querySelectorInput.value;
            saveSettings();
        }

    }

    function saveSettings(callback) {
        chrome.storage.sync.set(current_settings, 
            function () {
                console.log("Settings saved");
                if (callback) {
                    callback();
                }
            });
    }

    function loadSettings(callback) {
        chrome.storage.sync.get(default_settings,
            function(result) {
                current_settings = result;
                console.log("Settings loaded: " + JSON.stringify(current_settings));
                if (callback) {
                    callback();
                }
            });
    }

}());