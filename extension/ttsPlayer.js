// Constants
const PLAY_NEXT_DELAY = 200;
const REFRESH_INTERVAL = 500;

// Utility functions
function isNumeric(x) {
    return !isNaN(parseFloat(x)) && isFinite(x);
}

class TTSPlayer {

    constructor(textList) {
        this._textList = textList;
        this._lang = "zh_CN";
        this._voice = "";
        this._rate = 1;
        this._pitch = 1;
        this._volume = 1;

        this._currentIndex = 0;
        this._refreshId;

        this._isPlaying = false;

        // Event listeners
        this._onstart = null;
        this._onend = null;
    }

    playNext() {
        this._speak(this._currentIndex, function() {
            this._currentIndex += 1;
        });
    }

    play() {        
        // Use variable to bind function
        var initiatePlay = function() {
            if (this._currentIndex < this._textList.length && this._isPlaying) {
                // Notify onstart listener
                if (this._onstart) {
                    this._onstart(this._currentIndex);
                }
                
                console.log("ttsPlayer - Playing index " + this._currentIndex);
                this._speak(this._textList[this._currentIndex], function onend() {
                    // Notify onend listener
                    if (this._onend) {
                        this._onend(this._currentIndex);
                    }

                    // Continuous play
                    this._currentIndex += 1;
                    setTimeout(initiatePlay, PLAY_NEXT_DELAY);
                }.bind(this));
            }            
        }.bind(this);

        this._isPlaying = true;
        initiatePlay();
    }

    playAt(index) {
        if (index < this._textList.length) {
            speak(this._textList[index]);
        }
    }

    pause() {
        //clearTimeout(this._refreshId);
        this._isPaused = true;
        speechSynthesis.pause();        
    }

    resume() {
        this._isPaused = false;
        speechSynthesis.resume();
    }

    reset() {        
        this._currentIndex = 0;
        this._isPlaying = false;
        speechSynthesis.cancel();
    }

    skip() {
        // Cancel triggers the onend handler which will just move on to the next in queue.
        speechSynthesis.cancel();
    }

    speak(text, onend) {
        this._isPlaying = false;
        _speak(text, onend);
    }

    _speak(text, onend) {
        this._isPaused = false;
        // Cancel any on-going speeches
        // This also prevents a bug where speechSynthesis froze in a 'playing' state but isn't advancing
        speechSynthesis.cancel();

        var utter = new SpeechSynthesisUtterance();
        utter.text = text;
        utter.lang = this._lang;
        utter.pitch = this._pitch;
        utter.rate = this._rate;
        utter.volume = this._volume;
        var voices = speechSynthesis.getVoices();
        for (var v of voices) {
            if (v.name == this._voice) {
                utter.voice = v;
            }
        }

        utter.onstart = function (e) {
            console.log("ttsPlayer - Starting: " + e.utterance.text);
            speechSynthesisRefresher();
        }

        utter.onend = function (e) {
            console.log("ttsPlayer - Finished in " + e.elapsedTime + "ms");
            clearTimeout(this._refreshId);
            if (onend) {
                setTimeout(onend, 0);
            }
        }

        utter.onerror = function (e) {
            console.log("ttsPlayer - Error: " + e.error);
        }

        utter.onresume = function () {
            console.log("ttsPlayer - Resume");
            speechSynthesisRefresher();
        }

        utter.onpause = function () {
            console.log("ttsPlayer - Pause");
            clearTimeout(this._refreshId);
        }

        speechSynthesis.speak(utter);

        // There's a bug where SpeechSynthesis stops working if the text lasts longer than X seconds (15 seconds?). The solution is to never
        // let SpeechSynthesis run for that long by setting an interval to continuously pause/resume until speech is complete.
        var speechSynthesisRefresher = function() {
            if (!this._isPaused) {
                speechSynthesis.resume();
            }
            //speechSynthesis.pause();            
            this._refreshId = setTimeout(speechSynthesisRefresher, REFRESH_INTERVAL);
        }.bind(this);
    }

    get pitch() {
        return this._pitch;
    }

    set pitch(x) {
        if (isNumeric(x) && 0 <= x && x <= 2) {
            this._pitch = x;
        }
    }

    get rate() {
        return this._rate;
    }

    set rate(x) {
        if (isNumeric(x) && 0.1 <= x && x <= 10) {
            this._rate = x;
        }
    }

    get volume() {
        return this._volume;
    }

    set volume(x) {
        if (isNumeric(x) && 0 <= x && x <= 1) {
            this._volume = x;
        }
    }

    get voice() {
        return this._voice;
    }

    set voice(x) {
        this._voice = x;
    }

    get lang() {
        return this._lang;
    }

    set lang(x) {
        this._lang = x;
    }

    set onstart(callback) {
        this._onstart = callback;
    }

    set onend(callback) {
        this._onend = callback;
    }
}