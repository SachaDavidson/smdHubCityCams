const feeds = [];

/**
 * Gets a Camera Feed by its ID and displays it based on the provided Player ID
 * @param {string} playerId The HTML element ID of the JPEG
 * @param {number} id The Object ID Of the Camera
 */
async function getCameraFeed(playerId, id) {
    function addEvent(elem, event, func) {
        if (typeof window.event !== 'undefined') {
            elem.attachEvent('on' + event, func);
        } else {
            elem.addEventListener(event, func, false);
        }
    }

    function showJpegFrame(jpeg, serverUrl, token, id) {
        jpeg.src = serverUrl + "/Jpeg/" + id + "?authToken=" + token + "&" + new Date().getTime();
    }

    async function initCamera(jpeg, serverUrl, token, id, interval) {
        addEvent(jpeg, 'load', async function () {
            await new Promise(resolve => setTimeout(resolve, interval));
            showJpegFrame(jpeg, serverUrl, token, id);
        });

        showJpegFrame(jpeg, serverUrl, token, id);
    }

    const container = document.getElementById("camera-container");

    if (!container) {
        console.error("Container with ID 'camera-container' not found.");
        return;
    }

    const jpeg = document.createElement("img");
    jpeg.id = playerId;
    container.appendChild(jpeg);

    await initCamera(jpeg, "https://webcams.moncton.ca:8100", "1638a0fd-835e-4066-9cb1-d62ded24c2b1", id, 40);
}

/**
 * Fetches the Webcam Data from open.moncton.ca
 * @returns City of Moncton Webcam Data as an Object
 */
async function fetchWebcamsData() {
    const url = "https://services1.arcgis.com/E26PuSoie2Y7bbyI/arcgis/rest/services/Webcams/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json";

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (!!data.features) {
            for (const feature of data.features) {
                if (feature.attributes.URL !== "https://webcams.moncton.ca:8001/borepark/borepark-live.htm") {
                    let id = feature.attributes.OBJECTID;
                    let location = feature.attributes.Location;
                    let cameraid = feature.attributes.CameraID;
                    let camFeed = new WebcamFeed(id, location, cameraid);
                    feeds.push(camFeed);
                }
            }
        }

        return data;
    } catch (error) {
        console.error("Error fetching webcam data:", error);
        throw error;
    }
}

async function startCameraFeeds() {
    await fetchWebcamsData();

    for (const feed of feeds) {
        try {
            await getCameraFeed(`jpeg_${feed.id}`, feed.id);
        } catch (error) {
            console.error(`Error initializing camera feed for ID ${feed.id}:`, error);
        }
    }
}

class WebcamFeed {
    constructor(id, location, cameraid) {
        this.id = id;
        this.location = location;
        this.cameraid = cameraid;
    }
}

startCameraFeeds();