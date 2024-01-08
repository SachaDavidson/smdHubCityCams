const feeds = [];

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

async function getCameraFeed(playerId, feed) {
    const container = document.getElementById("camera-container");

    if (!container) {
        console.error("Container with ID 'camera-container' not found.");
        return;
    }

    const card = document.createElement("div");
    const jpeg = document.createElement("img");
    const title = document.createElement("h3");

    jpeg.id = playerId;
    card.classList.add("card");
    title.innerText = feed.cameraLocation;
    card.append(title);
    card.appendChild(jpeg);
    container.appendChild(card);

    await initCamera(jpeg, "https://webcams.moncton.ca:8100", "1638a0fd-835e-4066-9cb1-d62ded24c2b1", feed.id, 40);
}

async function fetchWebcamsData() {
    const url = "https://services1.arcgis.com/E26PuSoie2Y7bbyI/arcgis/rest/services/Webcams/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json";

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        return data;
    } catch (error) {
        console.error("Error fetching webcam data:", error);
        throw error;
    }
}

async function startCameraFeeds() {
    const data = await fetchWebcamsData();

    if (data.features) {
        for (const feature of data.features) {
            if (feature.attributes.URL !== "https://webcams.moncton.ca:8001/borepark/borepark-live.htm") {
                let cameraLocation = feature.attributes["Location"];
                let cameraId = feature.attributes["CameraID"];
                let id = 0;
                switch (cameraId) {
                    case "CAM007":
                        id = 5;
                        break;
                    case "CAM003":
                        id = 1;
                        break;
                    case "CAM006":
                        id = 4;
                        break;
                    case "CAM008":
                        id = 6;
                        break;
                    case "CAM001":
                        id = 2;
                        break;
                    case "CAM002":
                        id = 8;
                        break;
                    case "CAM009":
                        id = 7;
                        break;
                    case "CAM004":
                        id = 0;
                        break;
                    default:
                        id = 3;
                        break;
                }
                let camFeed = new WebcamFeed(id, cameraLocation, cameraId);
                feeds.push(camFeed);
            }
        }
    }

    feeds.forEach(feed => {
        try {
            getCameraFeed(`jpeg_${feed.id}`, feed);
        } catch (error) {
            console.error(`Error initializing camera feed for ID ${feed.id}:`, error);
        }
    });
}

class WebcamFeed {
    constructor(id, cameraLocation, camId) {
        this.id = id;
        this.cameraLocation = cameraLocation;
        this.camId = camId;
    }
}

startCameraFeeds();