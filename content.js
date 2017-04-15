
(function () {
    // Check for tts compatibility
    if (!('speechSynthesis' in window)) {
        console.log("SpeechSynthesis (TTL) is not supported on this browser version");
        return;
    }

    // Speech settings - default
    extensionSettings = {
        lang: "zh-CN",     // Chinese
        pitch: 1,       // 0 to 2
        rate: 1,        // 0.1 to 10
        volume: 1,      // 0 to 1
        voice: "Google 普通话（中国大陆）",
        query: "sentence.original"
    };

    // Listen for updates to settings
    chrome.storage.onChanged.addListener(onSettingsChanged);

    // Load settings then inject buttons
    loadSettings(function() {
        injectAudioButtons();
    });

    
    function injectAudioButtons() {
        // Find all chinese sentences
        var sentences = document.querySelectorAll(extensionSettings.query);

        // Use let to ensure the 'sentence' var is locally scoped and passed in to binding functions
        for (let sentence of sentences) {
            var button = document.createElement("input");
            //button.style.backgroundImage = "url('" + chrome.extension.getURL("play_icon.png") + "')";
            button.type = "image";
            button.style.height = "1em";
            button.style.width = "1em"
            button.src = chrome.extension.getURL("play_icon.png");
            button.onclick = function() {
                speak(sentence.textContent);
            }.bind(this);
            sentence.insertBefore(button, sentence.firstChild);
        }
    }

    function speakBatched(text) {
        // id for setTimeout(speechSynthesisRefresher)
        var refreshId;

        if (text.length == 0) {
            return;
        }

        var segment = text.substring(0, 10);
        var remainder = text.substring(10);

        // Cancel any on-going speeches
        // This also prevents a bug where speechSynthesis froze in a 'playing' state but isn't advancing
        speechSynthesis.cancel();

        var utter = new SpeechSynthesisUtterance();
        utter.text = segment;
        utter.lang = extensionSettings.lang;
        utter.pitch = extensionSettings.pitch;
        utter.rate = extensionSettings.rate;
        utter.volume = extensionSettings.volume;
        var voices = speechSynthesis.getVoices();
        for (var v of voices) {
            if (v.name == extensionSettings.voice) {
                utter.voice = v;
            }
        }

        utter.onend = function (e) {
            speakBatched(remainder);
        }.bind(this);

        speechSynthesis.speak(utter);
    }

    function speak(text) {
        // id for setTimeout(speechSynthesisRefresher)
        var refreshId;

        // Cancel any on-going speeches
        // This also prevents a bug where speechSynthesis froze in a 'playing' state but isn't advancing
        speechSynthesis.cancel();

        var utter = new SpeechSynthesisUtterance();
        utter.text = text;
        utter.lang = extensionSettings.lang;
        utter.pitch = extensionSettings.pitch;
        utter.rate = extensionSettings.rate;
        utter.volume = extensionSettings.volume;
        var voices = speechSynthesis.getVoices();
        for (var v of voices) {
            if (v.name == extensionSettings.voice) {
                utter.voice = v;
            }
        }

        utter.onstart = function (e) {
            speechSynthesisRefresher();
        }

        utter.onend = function (e) {
            clearTimeout(refreshId);
        }

        speechSynthesis.speak(utter);

        // There's a bug where SpeechSynthesis stops working if the text lasts longer than X seconds (15 seconds?). The solution is to never
        // let SpeechSynthesis run for that long by setting an interval to continuously pause/resume until speech is complete.
        function speechSynthesisRefresher() {
            //speechSynthesis.pause();
            speechSynthesis.resume();
            refreshId = setTimeout(speechSynthesisRefresher, 500);
        }
    }

    function loadSettings(callback) {
        chrome.storage.sync.get(null,
            function (result) {
                for (key in result) {
                    extensionSettings[key] = result[key];
                }
                if (callback) {
                    callback();
                }
            });
    }


    function onSettingsChanged(changes, namespace) {
        for (key in changes) {
            extensionSettings[key] = changes[key].newValue;
        }
    }

}())