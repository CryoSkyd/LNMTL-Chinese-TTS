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


    // Global variables
    var SENTENCES;
    var player;
    
    function injectAudioButtons() {
        // Find all chinese sentences
        SENTENCES = document.querySelectorAll(extensionSettings.query);
        var textList = [];
        for (let s of SENTENCES) {
            textList.push(s.textContent);
        }

        // Create player
        player = new TTSPlayer(textList);
        player.lang = extensionSettings.lang;
        player.voice = extensionSettings.voice;
        player.pitch = extensionSettings.pitch;
        player.rate = extensionSettings.rate;
        player.volume = extensionSettings.volume;
        player.onstart = function scrollAndHighlight(index) {
            scrollToCenter(SENTENCES[index]);
            SENTENCES[index].style.border = "gold solid";
        }
        player.onend = function removeHighlight(index) {
            SENTENCES[index].style.border = "";
        }

        // Use let to ensure the 'sentence' var is locally scoped and passed in to binding functions
        for (let sentence of SENTENCES) {
            var button = document.createElement("input");
            //button.style.backgroundImage = "url('" + chrome.extension.getURL("play_icon.png") + "')";
            button.type = "image";
            button.style.height = "1em";
            button.style.width = "1em"
            button.src = chrome.extension.getURL("play_icon.png");
            button.onclick = function() {
                //speak(sentence.textContent);
                player.speak(sentence.textContent);
            }.bind(this);
            sentence.insertBefore(button, sentence.firstChild);
        }

        // Add PlayAll button
        var playButton = createButton("Play", player.play.bind(player));
        var pauseButton = createButton("Pause", player.pause.bind(player));
        var resumeButton = createButton("Resume", player.resume.bind(player));
        var skipButton = createButton("Skip", player.skip.bind(player));

        var playerControls = document.createElement("div");
        playerControls.style.position = "fixed";
        playerControls.style.bottom = "0px";
        playerControls.style.left = "0px";
        playerControls.style.fontSize = "8px";
        playerControls.appendChild(playButton);
        playerControls.appendChild(pauseButton);
        playerControls.appendChild(resumeButton);
        playerControls.appendChild(skipButton);
        document.body.appendChild(playerControls);
    }

    function createButton(name, onclick) {
        var button = document.createElement("button");
        button.textContent = name;
        button.style.height = "2em";
        button.style.width = "5em";
        button.style.color = "black";
        button.style.fontSize = "1.25em";
        button.onclick = onclick;
        return button;
    }

    function scrollToCenter(element) {
        window.scrollBy(0, element.getBoundingClientRect().top - (window.innerHeight >> 1));
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
        if (player) {
            player.lang = extensionSettings.lang;
            player.voice = extensionSettings.voice;
            player.pitch = extensionSettings.pitch;
            player.rate = extensionSettings.rate;
            player.volume = extensionSettings.volume;
        }        
    }

}())