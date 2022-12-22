window.addEventListener('load', () => {
    // ==== DARK MODE =========
    // Check if dark mode is enabled
    if (localStorage.getItem('dark') === 'true') {
        document.body.classList.add('dark');
    }


    // ==============================================================
    // === LZMA =========
    var lzma = new LZMA("./js/min/lzma_worker.min.js");

    // ==== ROOT =========
    const ROOT = {
        url: document.location,
    }
    const WINDOW_CONFIG = {
        parent: document.querySelector('.textarea'),
        max: 4,
        min: 1,
        label: 'Window',
        current: 0,
        windows: [],
        windows_value: [],
    }

    // ==== ADD WINDOWS =========

    const addWindow = () => {
        if (WINDOW_CONFIG.current < WINDOW_CONFIG.max) {
            const newWindow = document.createElement('textarea');
            newWindow.setAttribute('class', 'textarea-main');
            newWindow.setAttribute('spellcheck', 'false');
            WINDOW_CONFIG.parent.appendChild(newWindow);
            WINDOW_CONFIG.windows.push(newWindow);
            WINDOW_CONFIG.current++;
        }
    }


    // === Close text offer =====
    const closeOffer = () =>  document.querySelector("body > footer").classList.remove("text-offer");

    // ==== MAIN =========
    const __main__ = () => {
        // Invert color
        const invert = document.querySelector('.invert-color');
        // Toggle invert color
        invert.addEventListener('click', () => {
            document.body.classList.toggle('dark');

            // Save to local storage
            if(document.body.classList.contains('dark')) {
                localStorage.setItem('dark', true);

                return;
            }

            localStorage.setItem('dark', false);
        });

        console.log(WINDOW_CONFIG.current, WINDOW_CONFIG.windows)
        // If the url hasn't generated any, create one
        if(WINDOW_CONFIG.current == 0) addWindow();

        // Add window
        document.querySelector('#add-w').addEventListener('click', addWindow);
        // Remove window
        document.querySelector('#remove-w').addEventListener('click', () => {
            if (WINDOW_CONFIG.current > WINDOW_CONFIG.min) {
                // Remove last window
                WINDOW_CONFIG.parent.removeChild(WINDOW_CONFIG.windows[WINDOW_CONFIG.windows.length - 1]);
                // Remove last window from array
                WINDOW_CONFIG.windows.pop();
                WINDOW_CONFIG.current--;
            }
        });


        // ==== URL GENERATOR =========
        document.querySelectorAll('#generate-url').forEach(btn => {
            btn.addEventListener('click', () => {
                const btn_type = btn.getAttribute('data-type');

                // Get all windows
                WINDOW_CONFIG.windows.forEach((window, index) => WINDOW_CONFIG.windows_value[index] = window.value);

                // Compress
                lzma.compress(JSON.stringify(WINDOW_CONFIG.windows_value), 1, (compressed, error) => {
                    if (error) {
                        alert("Failed to compress data: " + error);
                        return;
                    }
                    let reader = new FileReader();
                    reader.onload = function () {
                        let base64 = reader.result.substr(reader.result.indexOf(",") + 1);
                        let url = "https://" + ROOT.url.host + ROOT.url.pathname + "#" + base64;
                        var result = (btn_type === 'markdown') ? "[paste](" + url + ")" : url;

                        // Copy to clipboard
                        navigator.clipboard.writeText(result);
                        document.querySelector('.nav-text-offer input').value = result;
                        document.querySelector("body > footer").classList.add("text-offer");
                    };
                    reader.readAsDataURL(new Blob([new Uint8Array(compressed)]));
                });
            });
        });

        // === CANCEL TEXT OFFER ====
        document.querySelector('a.cancel-url').addEventListener('click', closeOffer);

        // === COPY TEXT OFFER ====
        document.querySelector('a.copy-url').addEventListener('click', ()=>{
            var input = document.querySelector('.nav-text-offer input');
            input.select();
            document.execCommand('copy');
            
            closeOffer()
        });
    };




    // ==== INIT =========
    fn = async () => {
        let base64 = location.hash.substring(1);
        if (base64.length == 0 || base64 == "undefined" || !fetch){
            // RUN MAIN
            __main__();
            return;
        }
        console.log(base64)
        // Decode base64

        let r = await fetch("data:application/octet-stream;base64," + base64);
        let blob = await r.blob();
        let reader = new FileReader();
        reader.onload = function () {
            var compressed_data = Array.from(new Uint8Array(reader.result));
            lzma.decompress(compressed_data, function (plaintext, error) {
                if (error) {
                    alert("Failed to decompress data: " + error);
                }
                // Write each window
                try {
                    const arrayData = JSON.parse(plaintext);
                    console.log(arrayData)
                    // If it is a object
                    if(typeof arrayData === 'object'){
                        arrayData.forEach((el, i) => {
                            addWindow();
                            // Write data
                            WINDOW_CONFIG.windows[i].value = el;
                        });
                    }
                } catch (error) {
                    alert("Failed to writing data: " + error);
                }

                // RUN MAIN
                __main__();
            });
        };
        reader.readAsArrayBuffer(blob);
    }; fn();
});