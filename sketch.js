let ratio = 1.6;
let globeScale;

let mic, fft, volSenseSlider, numRaindropsSlider;
let vol = 0.25;
let normVol;
let volSense = 100;
let slideStep = 10;
let startAudio = false;
let detectBeat = false;
let detectBeat2 = false;

let midColor1, midColor2, petalColor1, petalColor2, petalColor3, stemColor1;
let canColor1, flameColor1, canColor2, flameColor2, canColor3, flameColor3;
let baseHue1, baseHue2, baseHue3;
let lowFreqHue, highFreqHue;
let assetSize = 1;


// Define target and current positions for smoothing
let targetYOffset = 0, targetYOffset2 = 0, targetYOffset3 = 0, targetYOffset4 = 0;
let currentYOffset = 0, currentYOffset2 = 0, currentYOffset3 = 0, currentYOffset4 = 0;

let raindrops = [];
let numRaindrops = 50;
let rainDropyOffset = 0;

let displayFlowers = true; // Variable to track whether to display flowers or candles
let switchInterval = 10000; // Interval to switch between flowers and candles (in milliseconds)
let lastSwitchTime = 0; // Track the last switch time
let growthFactor = 1; // Growth factor for flames

let particleSystem;

function setup() {
    let canvas = createCanvas(window.innerWidth, window.innerWidth / ratio);
    globeScale = min(width, height);
    colorMode(HSB);
    getAudioContext().suspend();

    particleSystem = new ParticleSystem();

    // Set flower and candle colors
    midColor1 = color(50, 70, 100);
    midColor2 = color(35, 70, 100);
    petalColor1 = color(300, 80, 100);
    petalColor2 = color(200, 80, 100);
    petalColor3 = color(100, 80, 100);
    stemColor1 = color(120, 100, 60);
    canColor1 = color(45, 25, 100);
    canColor2 = color(10, 35, 100);
    canColor3 = color(300, 30, 100);
    flameColor1 = color(25, 100, 100);
    flameColor2 = color(75, 80, 100);
    flameColor3 = color(150, 50, 100);

    volSenseSlider = createSlider(0, 200, volSense, slideStep);
    volSenseSlider.position(10, 10);
    volSenseSlider.style('width', '400px');
    volSenseSlider.style('height', '20px');

    numRaindropsSlider = createSlider(10, 200, numRaindrops, slideStep);
    numRaindropsSlider.position(10, 50);
    numRaindropsSlider.style('width', '400px');
    numRaindropsSlider.style('height', '20px');
    numRaindropsSlider.class('slider-raindrop');

    mic = new p5.AudioIn();
    mic.start();
    fft = new p5.FFT();
    fft.setInput(mic);

    for (let i = 0; i < numRaindrops; i++) {
        raindrops.push(new Raindrop(random(width), random(height), 20, 40, random(1, 5)));
    }
}

function draw() {
    background(210, 35, 100);

    if (startAudio) {
        vol = mic.getLevel();
        let spectrum = fft.analyze();
        detectBeat = fft.getEnergy("bass") > 150;
        detectBeat2 = fft.getEnergy("bass") > 200;

        //Beat detection
        if (detectBeat2) {
            assetSize = 1.75;
        } else if (detectBeat) {
            assetSize = 1.5;
        } else {
            assetSize = 1;
        }

        //frequency analysis
        let lowFreqAvg = 0, highFreqAvg = 0, lowFreqCount = 0, highFreqCount = 0;

        for (let i = 0; i < spectrum.length; i++) {
            if (i < spectrum.length / 2) {
                lowFreqAvg += spectrum[i];
                lowFreqCount++;
            } else {
                highFreqAvg += spectrum[i];
                highFreqCount++;
            }
        }

        

        // sliders 
        volSense = volSenseSlider.value();
        let targetNumRaindrops = numRaindropsSlider.value();
        normVol = vol * volSense;

       // Calculate target positions based on volume
       targetYOffset = map(normVol, 0, 1, 0, -60) * 0.175;
       targetYOffset2 = map(normVol, 0, 1, 0, -100) * 0.275;
       targetYOffset3 = map(normVol, 0, 1, 0, -75) * 0.375;
       targetYOffset4 = map(normVol, 0, 1, 0, -140) * 0.475;

       // Smoothly interpolate current positions towards target positions
       currentYOffset = lerp(currentYOffset, targetYOffset, 0.1);
       currentYOffset2 = lerp(currentYOffset2, targetYOffset2, 0.1);
       currentYOffset3 = lerp(currentYOffset3, targetYOffset3, 0.1);
       currentYOffset4 = lerp(currentYOffset4, targetYOffset4, 0.1);


        //raindrop analysis
        rainDropyOffset = map(normVol, 0, 1, 0, 5);

        if (raindrops.length < targetNumRaindrops) {
            for (let i = raindrops.length; i < targetNumRaindrops; i++) {
                raindrops.push(new Raindrop(random(width), random(height), 20, 40, random(1, 5)));
            }
        } else if (raindrops.length > targetNumRaindrops) {
            raindrops.splice(targetNumRaindrops);
        }

        for (let raindrop of raindrops) {
            raindrop.update(rainDropyOffset);
            raindrop.display();
        }

        // Change flower colors based on volume
        baseHue1 = (hue(petalColor1) + map(normVol, 0, 1, -10, 10)) % 360;
        baseHue2 = (hue(petalColor2) + map(normVol, 0, 1, -10, 10)) % 360;
        baseHue3 = (hue(petalColor3) + map(normVol, 0, 1, -10, 10)) % 360;

        petalColor1 = color(baseHue1, 100, 100);
        petalColor2 = color(baseHue2, 100, 100);
        petalColor3 = color(baseHue3, 100, 100);

        // Switch between displaying flowers and candles based on the timer
    if (millis() - lastSwitchTime > switchInterval) {
        displayFlowers = !displayFlowers;
        lastSwitchTime = millis();
        growthFactor = 1; // Reset growth factor when switching to candles
        if (!displayFlowers) {
            particleSystem.addParticle(width / 2, height / 2, 50, color(255, 204, 0)); // Trigger explosion
        }
    }

    // Update growth factor
    if (!displayFlowers) {
        growthFactor += 0.01; // Only update growth factor for flames
    }

        // Display flowers or candles based on `displayFlowers` state
        if (displayFlowers) {
            // Day background with frenquency analysis
            lowFreqAvg /= lowFreqCount;
            highFreqAvg /= highFreqCount;

            lowFreqHue = map(lowFreqAvg, 0, 255, 160, 185);
            highFreqHue = map(highFreqAvg, 0, 255, 10, 60);

            for (let y = 0; y < height; y++) {
                let inter = map(y, 0, height, 0, 1);
                let c = lerpColor(color(lowFreqHue, 100, 100), color(highFreqHue, 100, 100), inter);
                stroke(c);
                line(0, y, width, y);
            }

            // Draw flowers
             flower(100, (window.innerHeight + 75) + currentYOffset, 250 * assetSize, 6, midColor1, petalColor1, stemColor1);
             flower(200, (window.innerHeight + 100) + currentYOffset2, 100 * assetSize, 6, midColor1, petalColor1, stemColor1);
             flower(300, (window.innerHeight + 25) + currentYOffset3, 150 * assetSize, 6, midColor2, petalColor3, stemColor1);
             flower(400, (window.innerHeight + 50) + currentYOffset4, 200 * assetSize, 6, midColor2, petalColor2, stemColor1); 
             flower(600, (window.innerHeight + 25) + currentYOffset3, 150 * assetSize, 6, midColor1, petalColor3, stemColor1);
             flower(800, (window.innerHeight + 75) + currentYOffset, 250 * assetSize, 6, midColor2, petalColor1, stemColor1);
             flower(900, (window.innerHeight + 100) + currentYOffset, 100 * assetSize, 6, midColor2, petalColor1, stemColor1);
             flower(1000, (window.innerHeight + 50) + currentYOffset2, 150 * assetSize, 6, midColor1, petalColor2, stemColor1);
             flower(1050, (window.innerHeight + 25) + currentYOffset3, 200 * assetSize, 6, midColor1, petalColor3, stemColor1);
             flower(1200, (window.innerHeight + 25) + currentYOffset3, 200 * assetSize, 6, midColor2, petalColor3, stemColor1);
             flower(1300, (window.innerHeight + 75) + currentYOffset, 100 * assetSize, 6, midColor1, petalColor1, stemColor1);
        } else {
            // Night background with frequency analysis
            lowFreqAvg /= lowFreqCount;
            highFreqAvg /= highFreqCount;

            lowFreqHue = map(lowFreqAvg, 0, 255, 210, 280);
            highFreqHue = map(highFreqAvg, 0, 255, 310, 330);

            for (let y = 0; y < height; y++) {
                let inter = map(y, 0, height, 0, 1);
                let c = lerpColor(color(lowFreqHue, 100, 100), color(highFreqHue, 100, 100), inter);
                stroke(c);
                line(0, y, width, y);
            }

            //Draw candles
             candle(40, (window.innerHeight + 50) + currentYOffset2, 150, assetSize, canColor3, flameColor3);
             candle(100, (window.innerHeight + 75) + currentYOffset, 100, assetSize, canColor1, flameColor1);
             candle(150, (window.innerHeight + 100) + currentYOffset3 , 50, assetSize, canColor2, flameColor1);
             candle(315, (window.innerHeight + 30) + currentYOffset2, 200, assetSize, canColor3, flameColor2);
             candle(400, (window.innerHeight + 50) + currentYOffset4, 75, assetSize, canColor2, flameColor1);
             candle(550, (window.innerHeight + 80) + currentYOffset, 95, assetSize, canColor1, flameColor3);
             candle(650, (window.innerHeight + 90) + currentYOffset2, 45, assetSize, canColor1, flameColor2);
             candle(750, (window.innerHeight + 120) + currentYOffset4, 130, assetSize, canColor2, flameColor2);
             candle(875, (window.innerHeight + 25) + currentYOffset4, 65, assetSize, canColor3, flameColor1);
             candle(900, (window.innerHeight + 90) + currentYOffset4, 75, assetSize, canColor2, flameColor1);
             candle(1000, (window.innerHeight + 30) + currentYOffset, 140, assetSize, canColor3, flameColor3);
             candle(1150, (window.innerHeight + 80) + currentYOffset3, 55, assetSize, canColor1, flameColor2);
             candle(1250, (window.innerHeight + 75) + currentYOffset, 190, assetSize, canColor3, flameColor1); 
        }
    }


    for (let raindrop of raindrops) {
        raindrop.update(rainDropyOffset);
        raindrop.display();
    }
    // Update and display particles for explosion effect
    particleSystem.update();
    particleSystem.display();

}

function mousePressed() {
    getAudioContext().resume().then(() => {
        if (!startAudio) {
            mic.start();
            startAudio = true;
            loop();
        }
    });
}