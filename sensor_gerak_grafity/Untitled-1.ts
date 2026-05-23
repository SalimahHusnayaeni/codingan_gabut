<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <title>Gesture Particles - Indonesia Voxel Map</title>

    <style>

        body { margin: 0; overflow: hidden; background: #050505; font-family: 'Segoe UI', Roboto, sans-serif; }

        #canvas-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }

        #input_video { position: absolute; transform: scaleX(-1); opacity: 0; width: 1px; height: 1px; pointer-events: none; }

        #ui-layer { position: absolute; top: 20px; left: 20px; z-index: 10; color: white; pointer-events: none; }

        .status {

            background: rgba(20, 20, 20, 0.6); backdrop-filter: blur(10px); padding: 10px 20px; border-radius: 30px;

            border: 1px solid rgba(255, 255, 255, 0.2); font-size: 14px; font-weight: 600; letter-spacing: 0.5px;

            text-transform: uppercase; display: flex; align-items: center; gap: 8px; transition: all 0.3s ease;

        }

        #gesture-icon { font-size: 18px; }

    </style>

    <script type="importmap">

        {

            "imports": {

                "three": "https://unpkg.com/three@0.160.0/build/three.module.js",

                "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"

            }

        }

    </script>

    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>

    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script>

</head>

<body>

    <div id="ui-layer">

        <div class="status" id="status-container">

            <span id="gesture-icon" style="display: none;"></span>

            <span id="status-text">Loading System...</span>

        </div>

    </div>

    <video id="input_video"></video>

    <div id="canvas-container"></div>



    <script type="module">

        import * as THREE from 'three';

        import { FontLoader } from 'three/addons/loaders/FontLoader.js';

        import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

        import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

        import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';

        import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

        import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';



        // --- KONFIGURASI ---

        const particleCount = 9500; // Meningkatkan jumlah partikel agar peta lebih padat

        const GLOBAL_SCALE = 1.0;



        const scene = new THREE.Scene();

        scene.fog = new THREE.FogExp2(0x000000, 0.0015);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        camera.position.z = 95;

        const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });

        renderer.setSize(window.innerWidth, window.innerHeight);

        renderer.setPixelRatio(window.devicePixelRatio);

        renderer.toneMapping = THREE.ReinhardToneMapping;

        document.getElementById('canvas-container').appendChild(renderer.domElement);



        const renderScene = new RenderPass(scene, camera);

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 0.4, 0.85);

        bloomPass.threshold = 0; 

        bloomPass.strength = 2.0; // Bloom diperkuat untuk efek Neon

        bloomPass.radius = 0.5;

        const composer = new EffectComposer(renderer);

        composer.addPass(renderScene); composer.addPass(bloomPass);



        // --- PARTIKEL UTAMA (VOXEL STYLE) ---

        const geometry = new THREE.BufferGeometry();

        const currentPositions = new Float32Array(particleCount * 3);

        const targetPositions = new Float32Array(particleCount * 3);

        const currentColors = new Float32Array(particleCount * 3);

        const targetColors = new Float32Array(particleCount * 3);

        const initialColor = new THREE.Color(0xffaa00);

        

        for (let i = 0; i < particleCount * 3; i+=3) {

            currentPositions[i] = (Math.random() - 0.5) * 100;

            currentPositions[i+1] = (Math.random() - 0.5) * 100;

            currentPositions[i+2] = (Math.random() - 0.5) * 100;

            targetPositions[i] = currentPositions[i];

            currentColors[i] = initialColor.r; currentColors[i+1] = initialColor.g; currentColors[i+2] = initialColor.b;

            targetColors[i] = initialColor.r; targetColors[i+1] = initialColor.g; targetColors[i+2] = initialColor.b;

        }

        geometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));

        geometry.setAttribute('color', new THREE.BufferAttribute(currentColors, 3));

        

        const material = new THREE.PointsMaterial({ 

            size: 0.4, // Ukuran sedikit dibesarkan agar rapat

            blending: THREE.AdditiveBlending, 

            transparent: true, 

            opacity: 0.95, 

            depthWrite: false, 

            vertexColors: true 

        });

        const particles = new THREE.Points(geometry, material);

        scene.add(particles);



        // --- DEBU ANGKASA ---

        const dustCount = 2000;

        const dustGeometry = new THREE.BufferGeometry();

        const dustPositions = new Float32Array(dustCount * 3);

        const dustVelocities = [];

        for (let i = 0; i < dustCount; i++) {

            dustPositions[i * 3] = (Math.random() - 0.5) * 500;

            dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 500;

            dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 500;

            dustVelocities.push({x: (Math.random() - 0.5) * 0.05, y: (Math.random() - 0.5) * 0.05, z: (Math.random() - 0.5) * 0.05});

        }

        dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

        const dustMaterial = new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.12, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending });

        const dustParticles = new THREE.Points(dustGeometry, dustMaterial);

        scene.add(dustParticles);



        // --- SISTEM BULAN (EARTH MODE) ---

        let moonGroup;

        const EARTH_RADIUS_ISOLATED = 25; 

        const MOON_ORBIT_RADIUS = 38; 



        function createMoonSystem() {

            const moonParticleCount = 200;

            const moonGeo = new THREE.BufferGeometry();

            const moonPos = new Float32Array(moonParticleCount * 3);

            const moonCols = new Float32Array(moonParticleCount * 3);

            const moonPalette = [0xaaaaaa, 0xcccccc, 0x999999, 0xeeeeee];

            const moonRadius = 1.5;

            for (let i = 0; i < moonParticleCount; i++) {

                const r = moonRadius * (0.95 + Math.random() * 0.1); 

                const theta = Math.random() * 2 * Math.PI, phi = Math.acos(2 * Math.random() - 1);

                const ix = i * 3;

                moonPos[ix] = r * Math.sin(phi) * Math.cos(theta);

                moonPos[ix+1] = r * Math.sin(phi) * Math.sin(theta);

                moonPos[ix+2] = r * Math.cos(phi);

                const colorHex = moonPalette[Math.floor(Math.random() * moonPalette.length)];

                const color = new THREE.Color(colorHex);

                moonCols[ix] = color.r; moonCols[ix+1] = color.g; moonCols[ix+2] = color.b;

            }

            moonGeo.setAttribute('position', new THREE.BufferAttribute(moonPos, 3));

            moonGeo.setAttribute('color', new THREE.BufferAttribute(moonCols, 3));

            const moonMat = new THREE.PointsMaterial({ size: 0.15, blending: THREE.AdditiveBlending, transparent: true, opacity: 1.0, depthWrite: false, vertexColors: true });

            const moonParticles = new THREE.Points(moonGeo, moonMat);

            moonParticles.position.x = MOON_ORBIT_RADIUS; 



            const orbitPointCount = 700;

            const orbitGeo = new THREE.BufferGeometry();

            const orbitPos = new Float32Array(orbitPointCount * 3);

            const orbitCols = new Float32Array(orbitPointCount * 3);

            for(let i=0; i<orbitPointCount; i++) {

                const theta = (i / orbitPointCount) * Math.PI * 2;

                const ix = i * 3;

                orbitPos[ix] = MOON_ORBIT_RADIUS * Math.cos(theta); orbitPos[ix+1] = 0; orbitPos[ix+2] = MOON_ORBIT_RADIUS * Math.sin(theta);

                orbitCols[ix] = 1.0; orbitCols[ix+1] = 1.0; orbitCols[ix+2] = 1.0; 

            }

            orbitGeo.setAttribute('position', new THREE.BufferAttribute(orbitPos, 3));

            orbitGeo.setAttribute('color', new THREE.BufferAttribute(orbitCols, 3));

            const orbitMat = new THREE.PointsMaterial({ size: 0.1, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.4, vertexColors: true });

            const orbitLineParticles = new THREE.Points(orbitGeo, orbitMat);



            moonGroup = new THREE.Group();

            moonGroup.add(moonParticles);

            moonGroup.add(orbitLineParticles); 

            scene.add(moonGroup);

            moonGroup.visible = false; 

        }

        createMoonSystem();



        let targetGroupPosition = new THREE.Vector3(0, 0, 0);

        const shapes = { solar: [], cloud: [], saturn: [], heart: [], text: [], earthIsolated: [], indonesia: [] };



        // --- HELPER FUNCTIONS ---

        const sunPalette = [0xffdd00, 0xffaa00, 0xffcc33];

        const mercuryPalette = [0xaaaaaa, 0x888888, 0xcccccc];

        const venusPalette = [0xfffce6, 0xffd27f, 0xc77d34, 0xffe8a3];

        const earthPalette = [0x2255ff, 0x0044cc, 0x008855, 0x33aa33, 0xffffff, 0xeeeeee];

        const marsPalette = [0xff3300, 0xcc2200, 0xdd5522];

        const jupiterPalette = [0xd4a373, 0xcfb997, 0xbc8f8f, 0xcd853f, 0xffefdb];

        const uranusPalette = [0x55ffff, 0x77ddff, 0xaaffff];

        const neptunePalette = [0x3333ff, 0x0000dd, 0x5555ff];



        const setTargetColorRange = (startIndex, count, hexColor) => {

            const color = new THREE.Color(hexColor);

            for (let i = startIndex; i < startIndex + count; i++) {

                targetColors[i*3] = color.r; targetColors[i*3+1] = color.g; targetColors[i*3+2] = color.b;

            }

        };

        const setTargetColorPalette = (startIndex, count, palette) => {

            for (let i = startIndex; i < startIndex + count; i++) {

                const colorHex = palette[Math.floor(Math.random() * palette.length)];

                const color = new THREE.Color(colorHex);

                targetColors[i*3] = color.r; targetColors[i*3+1] = color.g; targetColors[i*3+2] = color.b;

            }

        };



        function getSpherePositions(cx, cy, cz, r, count) {

            const pos = [];

            for (let i = 0; i < count; i++) {

                const radius = r * (0.99 + Math.random() * 0.02); 

                const theta = Math.random() * 2 * Math.PI; const phi = Math.acos(2 * Math.random() - 1);

                pos.push(cx + radius * Math.sin(phi) * Math.cos(theta), cy + radius * Math.sin(phi) * Math.sin(theta), cz + radius * Math.cos(phi));

            }

            return pos;

        }



        function calculateSolarSystem() {

            const tempPos = []; let pIndex = 0;

            const addSphere = (cx, cy, cz, r, count, palette) => {

                const startIndex = pIndex;

                for (let i = 0; i < count; i++) {

                    const radius = r * (0.99 + Math.random() * 0.02); 

                    const theta = Math.random() * 2 * Math.PI; const phi = Math.acos(2 * Math.random() - 1);

                    tempPos.push(cx + radius * Math.sin(phi) * Math.cos(theta), cy + radius * Math.sin(phi) * Math.sin(theta), cz + radius * Math.cos(phi)); pIndex++;

                }

                setTargetColorPalette(startIndex, count, palette);

            };

            const addOrbit = (radius, count, colorHex) => {

                 const startIndex = pIndex;

                 for (let i = 0; i < count; i++) {

                    const theta = Math.random() * 2 * Math.PI; const rVar = radius + (Math.random() - 0.5) * 0.5;

                    tempPos.push(rVar * Math.cos(theta), (Math.random() - 0.5) * 0.5, rVar * Math.sin(theta)); pIndex++;

                }

                setTargetColorRange(startIndex, count, colorHex);

            };

            const addBeautifulVenus = (cx, cy, cz, r, count) => {

                for (let i = 0; i < count; i++) {

                    const radiusVar = r * (0.98 + Math.random() * 0.04);

                    const theta = Math.random() * 2 * Math.PI; const phi = Math.acos(2 * Math.random() - 1);

                    tempPos.push(cx + radiusVar * Math.sin(phi) * Math.cos(theta), cy + radiusVar * Math.sin(phi) * Math.sin(theta), cz + radiusVar * Math.cos(phi));

                    const colorHex = venusPalette[Math.floor(Math.random() * venusPalette.length)];

                    const color = new THREE.Color(colorHex);

                    targetColors[pIndex*3] = color.r; targetColors[pIndex*3+1] = color.g; targetColors[pIndex*3+2] = color.b; pIndex++;

                }

            };

            const addBeautifulSaturnRings = (cx, cy, cz, planetRadius, tiltAngle) => {

                const bands = [{ rStart: 1.3, rEnd: 2.0, count: 400, palette: [0xfff4e8, 0xffe0b0] }, { rStart: 2.2, rEnd: 3.2, count: 350, palette: [0xd8c6a8, 0xc0a080] }];

                bands.forEach(band => {

                    for (let i = 0; i < band.count; i++) {

                        const r = planetRadius * (band.rStart + Math.random() * (band.rEnd - band.rStart));

                        const theta = Math.random() * 2 * Math.PI;

                        let x = r * Math.cos(theta), y = (Math.random() - 0.5) * 0.15, z = r * Math.sin(theta);

                        let xTilted = x * Math.cos(tiltAngle) - y * Math.sin(tiltAngle), yTilted = x * Math.sin(tiltAngle) + y * Math.cos(tiltAngle), zTilted = z;

                        tempPos.push(cx + xTilted, cy + yTilted, cz + zTilted);

                        const colorHex = band.palette[Math.floor(Math.random() * band.palette.length)];

                        const color = new THREE.Color(colorHex);

                        targetColors[pIndex*3] = color.r; targetColors[pIndex*3+1] = color.g; targetColors[pIndex*3+2] = color.b; pIndex++;

                    }

                });

            };



            addSphere(0, 0, 0, 14, 1400, sunPalette); 

            const planets = [

                { name: 'Mercury', dist: 16, size: 2.5, angle: 0, palette: mercuryPalette },

                { name: 'Venus',   dist: 22, size: 3.8, angle: 1.5, isVenus: true },

                { name: 'Earth',   dist: 30, size: 3.8, angle: 3.0, palette: earthPalette },

                { name: 'Mars',    dist: 38, size: 3.0, angle: 4.5, palette: marsPalette },

                { name: 'Jupiter', dist: 52, size: 9.0, angle: 0.5, palette: jupiterPalette },

                { name: 'Saturn',  dist: 68, size: 7.5, angle: 2.5, palette: venusPalette, isSaturn: true },

                { name: 'Uranus',  dist: 84, size: 5.0, angle: 5.0, palette: uranusPalette },

                { name: 'Neptune', dist: 96, size: 4.8, angle: 1.0, palette: neptunePalette }

            ];

            planets.forEach(p => {

                const px = p.dist * Math.cos(p.angle), pz = p.dist * Math.sin(p.angle);

                if (p.isVenus) addBeautifulVenus(px, 0, pz, p.size, 600);

                else addSphere(px, 0, pz, p.size, 450, p.palette);

                addOrbit(p.dist, 200, 0x444444);

                if(p.isSaturn) addBeautifulSaturnRings(px, 0, pz, p.size, 0.47);

            });

            const startIndex = pIndex;

            while(tempPos.length < particleCount * 3) {

                 const r = 110 * Math.cbrt(Math.random()), theta = Math.random() * 2 * Math.PI, phi = Math.acos(2 * Math.random() - 1);

                 tempPos.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)); pIndex++;

            }

            setTargetColorRange(startIndex, pIndex - startIndex, 0x333333);

            return tempPos;

        }



        function calculateScatteredCloud() {

            const tempPos = [];

            for (let i = 0; i < particleCount; i++) {

                const r = 60 + Math.random() * 120, theta = Math.random() * 2 * Math.PI, phi = Math.acos(2 * Math.random() - 1);

                tempPos.push(r * Math.sin(phi) * Math.cos(theta) * GLOBAL_SCALE, r * Math.sin(phi) * Math.sin(theta) * GLOBAL_SCALE, r * Math.cos(phi) * GLOBAL_SCALE);

            }

            return tempPos;

        }



        function calculateSaturnGesture() {

            const tempPos = []; let pIndex = 0;

            const bodyCount = Math.floor(particleCount * 0.35), ringCount = particleCount - bodyCount;

            const saturnBodyPalette = [0xffd27f, 0xc77d34, 0xffe8a3, 0xeaddca];

            const saturnRingPalette = [0xfff4e8, 0xffe0b0, 0xd8c6a8, 0xc0a080];

            const startIndexBody = pIndex;

            for (let i = 0; i < bodyCount; i++) {

                const r = 16 * (0.98 + Math.random() * 0.04); 

                const theta = Math.random() * 2 * Math.PI, phi = Math.acos(2 * Math.random() - 1);

                let x = r * Math.sin(phi) * Math.cos(theta), y = r * Math.sin(phi) * Math.sin(theta), z = r * Math.cos(phi);

                const tilt = Math.PI / 6;

                tempPos.push((x * Math.cos(tilt) - y * Math.sin(tilt)) * GLOBAL_SCALE, (x * Math.sin(tilt) + y * Math.cos(tilt)) * GLOBAL_SCALE, z * GLOBAL_SCALE); pIndex++;

            }

            setTargetColorPalette(startIndexBody, bodyCount, saturnBodyPalette);

            const startIndexRing = pIndex;

            for (let i = 0; i < ringCount; i++) {

                let r = (Math.random() < 0.4) ? 22 + Math.random() * 8 : 34 + Math.random() * 12;

                const theta = Math.random() * 2 * Math.PI;

                let x = r * Math.cos(theta), y = (Math.random() - 0.5) * 1.5, z = r * Math.sin(theta);

                const tiltZ = Math.PI / 6, tiltX = Math.PI / 9;

                let x1 = x * Math.cos(tiltZ) - y * Math.sin(tiltZ), y1 = x * Math.sin(tiltZ) + y * Math.cos(tiltZ), z1 = z;

                tempPos.push(x1 * GLOBAL_SCALE, (y1 * Math.cos(tiltX) - z1 * Math.sin(tiltX)) * GLOBAL_SCALE, (y1 * Math.sin(tiltX) + z1 * Math.cos(tiltX)) * GLOBAL_SCALE); pIndex++;

            }

            setTargetColorPalette(startIndexRing, ringCount, saturnRingPalette);

            return tempPos;

        }



        function calculateHeart() {

            const finalPos = []; const desiredPoints = 1500; const uniquePoints = [];

            for (let i = 0; i < desiredPoints; i++) {

                const t = (i / desiredPoints) * Math.PI * 2;

                let xBase = 16 * Math.pow(Math.sin(t), 3), yBase = (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) + 5;

                const thickness = 0.3, theta = Math.random() * Math.PI * 2, phi = Math.acos(Math.random() * 2 - 1), rRandom = Math.random() * thickness;

                uniquePoints.push((xBase + rRandom * Math.sin(phi) * Math.cos(theta)) * GLOBAL_SCALE, (yBase + rRandom * Math.sin(phi) * Math.sin(theta)) * GLOBAL_SCALE, (rRandom * Math.cos(phi) * 1.5) * GLOBAL_SCALE);

            }

            for (let i = 0; i < particleCount; i++) {

                const index = (i % desiredPoints) * 3;

                finalPos.push(uniquePoints[index], uniquePoints[index+1], uniquePoints[index+2]);

            }

            return finalPos;

        }



        const loader = new FontLoader();

        loader.load('https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_regular.typeface.json', function (font) {

            

            // --- SETUP TULISAN "I LOVE MY SELF" ---

            const textGeo = new TextGeometry('I LOVE\nMY SELF', { font: font, size: 8, height: 0.5, curveSegments: 6, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.1, bevelSegments: 2 });

            textGeo.center();

            const sampler = new MeshSurfaceSampler(new THREE.Mesh(textGeo, new THREE.MeshBasicMaterial())).build();

            const tempPosition = new THREE.Vector3(); const desiredTextPoints = 2500; const uniqueTextPoints = [];

            for (let i = 0; i < desiredTextPoints; i++) {

                sampler.sample(tempPosition); uniqueTextPoints.push(tempPosition.x * GLOBAL_SCALE, tempPosition.y * GLOBAL_SCALE, tempPosition.z * GLOBAL_SCALE);

            }

            const finalTextPoints = [];

             for (let i = 0; i < particleCount; i++) {

                const index = (i % desiredTextPoints) * 3; finalTextPoints.push(uniqueTextPoints[index], uniqueTextPoints[index+1], uniqueTextPoints[index+2]);

            }

            shapes.text = finalTextPoints;



            // --- SETUP TULISAN "INDONESIA" ---

            const indoTextGeo = new TextGeometry('INDONESIA', { font: font, size: 7, height: 0.8, curveSegments: 4, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.05 });

            indoTextGeo.center();

            indoTextGeo.translate(0, -18, 0); // Di bawah peta

            

            const indoSampler = new MeshSurfaceSampler(new THREE.Mesh(indoTextGeo, new THREE.MeshBasicMaterial())).build();

            const indoTextPoints = [];

            for(let i=0; i<3000; i++) {

                indoSampler.sample(tempPosition);

                indoTextPoints.push(tempPosition.x, tempPosition.y, tempPosition.z);

            }



            // --- FUNGSI FALLBACK: PROCEDURAL INDONESIA MAP ---

            function createProceduralIndonesia() {

                const mapPoints = [];

                // 1. Sumatera

                for(let i=0; i<800; i++) {

                    const t = Math.random(); const x = -50 + t * 25 + (Math.random()-0.5)*3; const y = 10 - t * 20 + (Math.random()-0.5)*3;

                    mapPoints.push(x, y, (Math.random()-0.5)*2);

                }

                // 2. Kalimantan

                for(let i=0; i<900; i++) {

                    const x = -10 + (Math.random()-0.5) * 18; const y = 12 + (Math.random()-0.5) * 12;

                    mapPoints.push(x, y, (Math.random()-0.5)*2);

                }

                // 3. Jawa

                for(let i=0; i<700; i++) {

                    const x = -15 + Math.random() * 25; const y = -8 + (Math.random()-0.5) * 3;

                    mapPoints.push(x, y, (Math.random()-0.5)*2);

                }

                // 4. Sulawesi

                for(let i=0; i<600; i++) {

                    const x = 20 + (Math.random()-0.5) * 8; const y = 10 + (Math.random()-0.5) * 14;

                    mapPoints.push(x, y, (Math.random()-0.5)*2);

                }

                // 5. Papua

                for(let i=0; i<700; i++) {

                    const x = 50 + (Math.random()-0.5) * 15; const y = 5 + (Math.random()-0.5) * 10;

                    mapPoints.push(x, y, (Math.random()-0.5)*2);

                }

                

                const fullShape = [];

                const totalMap = mapPoints.length / 3;

                const totalText = indoTextPoints.length / 3;

                

                // Gunakan 65% partikel untuk peta, 35% untuk teks

                for(let i=0; i<particleCount; i++) {

                      if (i < particleCount * 0.65) {

                          const idx = (i % Math.floor(totalMap)) * 3;

                          fullShape.push(mapPoints[idx], mapPoints[idx+1], mapPoints[idx+2]);

                      } else { 

                          const idx = (i % Math.floor(totalText)) * 3;

                          fullShape.push(indoTextPoints[idx], indoTextPoints[idx+1], indoTextPoints[idx+2]);

                      }

                }

                return fullShape;

            }



            // --- LOAD GAMBAR PETA ---

            const img = new Image();

            img.crossOrigin = "Anonymous";

            img.src = 'image_feb35a.png'; 

            

            img.onload = function() {

                const canvas = document.createElement('canvas');

                const ctx = canvas.getContext('2d');

                canvas.width = 150; canvas.height = 75; 

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                try {

                    const data = ctx.getImageData(0,0, canvas.width, canvas.height).data;

                    const mapPoints = [];

                    for(let y=0; y<canvas.height; y++) {

                        for(let x=0; x<canvas.width; x++) {

                            const alpha = data[(y*canvas.width + x)*4 + 3];

                            if(alpha > 128) {

                                const pX = (x - canvas.width/2) * 0.7; 

                                const pY = -(y - canvas.height/2) * 0.7 + 10; 

                                const pZ = (Math.random() - 0.5) * 2; 

                                mapPoints.push(pX, pY, pZ);

                            }

                        }

                    }

                    const fullShape = [];

                    const totalMap = mapPoints.length / 3;

                    const totalText = indoTextPoints.length / 3;

                    for(let i=0; i<particleCount; i++) {

                         if (mapPoints.length > 0 && i < particleCount * 0.65) {

                             const idx = (i % Math.floor(totalMap)) * 3;

                             fullShape.push(mapPoints[idx], mapPoints[idx+1], mapPoints[idx+2]);

                         } else {

                             const idx = (i % Math.floor(totalText)) * 3;

                             fullShape.push(indoTextPoints[idx], indoTextPoints[idx+1], indoTextPoints[idx+2]);

                         }

                    }

                    shapes.indonesia = fullShape;

                } catch (e) {

                    shapes.indonesia = createProceduralIndonesia();

                }

            };



            img.onerror = function() {

                shapes.indonesia = createProceduralIndonesia();

            };

            

            shapes.solar = calculateSolarSystem(); 

            shapes.cloud = calculateScatteredCloud(); 

            shapes.saturn = calculateSaturnGesture(); 

            shapes.heart = calculateHeart(); 

            shapes.earthIsolated = getSpherePositions(0, 0, 0, EARTH_RADIUS_ISOLATED, particleCount);



            setTargetShape('solar'); updateUIState('no-hand');

        });



        let currentShape = 'solar'; let targetSize = 0.14;

        let moonOrbitAngle = 0; 



        function setTargetShape(shapeName) {

            if (currentShape === shapeName || !shapes[shapeName] || shapes[shapeName].length === 0) return;

            currentShape = shapeName;

            const newPos = shapes[shapeName];

            

            for (let i = 0; i < particleCount; i++) {

                targetPositions[i * 3] = newPos[i * 3]; targetPositions[i * 3 + 1] = newPos[i * 3 + 1]; targetPositions[i * 3 + 2] = newPos[i * 3 + 2];

            }

            

            // --- LOGIKA WARNA DIPERBAIKI ---

            if (shapeName === 'indonesia') {

                for(let i=0; i<particleCount; i++) {

                    // Gunakan threshold yang sama (65%) seperti saat pembentukan shape

                    // i < 65% = MAP (MERAH), Sisanya = TEXT (PUTIH)

                    let col;

                    if (i < particleCount * 0.65) { 

                        col = new THREE.Color(0xff0000); // Merah Peta

                    } else {

                        col = new THREE.Color(0xffffff); // Putih Teks

                    }

                    targetColors[i*3] = col.r; targetColors[i*3+1] = col.g; targetColors[i*3+2] = col.b;

                }

            } else {

                let uniformPalette = null;

                if (shapeName === 'text') uniformPalette = [0x00ffff, 0x55ffff, 0xaaffff];

                else if (shapeName === 'heart') uniformPalette = [0xff3366, 0xff6699, 0xff99cc];

                else if (shapeName === 'cloud') uniformPalette = [0xaaaaaa, 0xcccccc, 0xeeeeee];

                else if (shapeName === 'earthIsolated') uniformPalette = earthPalette;



                if (uniformPalette !== null) {

                      setTargetColorPalette(0, particleCount, uniformPalette);

                } else if (shapeName === 'solar') {

                      calculateSolarSystem(); 

                } else if (shapeName === 'saturn') {

                      calculateSaturnGesture();

                }

            }



            if (moonGroup) {

                moonGroup.visible = (shapeName === 'earthIsolated');

            }



            if (shapeName === 'cloud') targetSize = 1.2; 

            else if (shapeName === 'indonesia') targetSize = 0.40; // Size lebih besar agar voxel padat

            else if (shapeName === 'solar') targetSize = 0.16; 

            else targetSize = 0.14;

        }



        const gestureIconSpan = document.getElementById('gesture-icon'); const statusTextSpan = document.getElementById('status-text'); const statusContainer = document.getElementById('status-container');

        function updateUIState(state, icon = '', text = '') {

            if (state === 'no-hand') {

                gestureIconSpan.style.display = 'none'; statusTextSpan.innerText = 'SOLAR SYSTEM MODE'; statusContainer.style.backgroundColor = 'rgba(20, 20, 20, 0.6)';

                statusContainer.style.borderColor = "rgba(255, 255, 255, 0.2)";

            } else if (state === 'detected') {

                gestureIconSpan.style.display = 'block'; gestureIconSpan.innerText = icon; statusTextSpan.innerText = text; statusContainer.style.backgroundColor = 'rgba(40, 40, 40, 0.8)';

                if (text.includes("INDONESIA")) {

                    statusContainer.style.borderColor = "rgba(255, 0, 0, 0.8)"; // Border Merah saat Indonesia aktif

                } else {

                    statusContainer.style.borderColor = "rgba(255, 255, 255, 0.2)";

                }

            }

        }



        function onResults(results) {

            // DETEKSI 2 TANGAN KHUSUS INDONESIA

            if (results.multiHandLandmarks && results.multiHandLandmarks.length === 2) {

                 setTargetShape('indonesia');

                 updateUIState('detected', "🇮🇩", "INDONESIA RAYA");

                 // Kunci posisi di tengah layar saat mode Indonesia

                 targetGroupPosition.set(0, 0, 0); 

            }

            else if (results.multiHandLandmarks && results.multiHandLandmarks.length === 1) {

                const lm = results.multiHandLandmarks[0];

                const handX = lm[9].x; const handY = lm[9].y;

                const dist = camera.position.z;

                const vFOV = THREE.MathUtils.degToRad(camera.fov);

                const height = 2 * Math.tan(vFOV / 2) * dist;

                const width = height * camera.aspect;

                targetGroupPosition.set(-(handX - 0.5) * width, -(handY - 0.5) * height, 0);

                const indexUp = lm[8].y < lm[6].y; const middleUp = lm[12].y < lm[10].y; const ringUp = lm[16].y < lm[14].y; const pinkyUp = lm[20].y < lm[18].y; const pinchDist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);

                

                if (pinchDist < 0.05) { setTargetShape('heart'); updateUIState('detected', "🫰", "Love (Ring)"); }

                else if (!indexUp && !middleUp && !ringUp && !pinkyUp) { setTargetShape('saturn'); updateUIState('detected', "✊", "Saturn Gesture"); }

                else if (indexUp && middleUp && !ringUp && !pinkyUp) { setTargetShape('text'); updateUIState('detected', "✌️", "Peace: I Love My Self"); }

                else { 

                    setTargetShape('earthIsolated'); 

                    updateUIState('detected', "🖐️", "Earth & Moon Mode"); 

                }

            } else {

                targetGroupPosition.set(0, 0, 0); setTargetShape('solar'); updateUIState('no-hand');

            }

        }



        const videoElement = document.getElementById('input_video');

        const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});

        hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });

        hands.onResults(onResults);

        const cameraUtils = new Camera(videoElement, { onFrame: async () => { await hands.send({image: videoElement}); }, width: 640, height: 480 });

        cameraUtils.start();



        function animate() {

            requestAnimationFrame(animate);

            

            particles.position.lerp(targetGroupPosition, 0.1);

            const positions = particles.geometry.attributes.position.array; const colors = particles.geometry.attributes.color.array;

            const speed = 0.08; const colorSpeed = 0.05;

            for (let i = 0; i < particleCount; i++) {

                const ix = i * 3;

                positions[ix] += (targetPositions[ix] - positions[ix]) * speed; positions[ix+1] += (targetPositions[ix+1] - positions[ix+1]) * speed; positions[ix+2] += (targetPositions[ix+2] - positions[ix+2]) * speed;

                colors[ix] += (targetColors[ix] - colors[ix]) * colorSpeed; colors[ix+1] += (targetColors[ix+1] - colors[ix+1]) * colorSpeed; colors[ix+2] += (targetColors[ix+2] - colors[ix+2]) * colorSpeed;

                if (currentShape === 'cloud') { positions[ix] += (Math.random() - 0.5) * 0.5; positions[ix+1] += (Math.random() - 0.5) * 0.5; positions[ix+2] += (Math.random() - 0.5) * 0.5; }

            }

            particles.geometry.attributes.position.needsUpdate = true; particles.geometry.attributes.color.needsUpdate = true;

            particles.material.size = THREE.MathUtils.lerp(particles.material.size, targetSize, 0.1);

            

            if (currentShape === 'solar') {

                particles.rotation.y += 0.002; 

                particles.rotation.x = THREE.MathUtils.lerp(particles.rotation.x, 0.2, 0.05); 

                particles.rotation.z = THREE.MathUtils.lerp(particles.rotation.z, 0, 0.1);

            } 

            else if (currentShape === 'earthIsolated') {

                particles.rotation.y += 0.005; 

                particles.rotation.x = THREE.MathUtils.lerp(particles.rotation.x, 0, 0.1);

                particles.rotation.z = THREE.MathUtils.lerp(particles.rotation.z, 0, 0.1);

                if (moonGroup) {

                    moonGroup.position.lerp(targetGroupPosition, 0.1);

                    const tiltX = THREE.MathUtils.degToRad(20); const tiltZ = THREE.MathUtils.degToRad(10); 

                    moonGroup.rotation.x = tiltX; moonGroup.rotation.z = tiltZ;

                    moonOrbitAngle += 0.04; moonGroup.rotation.y = moonOrbitAngle;

                }

            }

            else if (currentShape === 'indonesia') {

                // Saat mode Indonesia, stop rotasi agar teks terbaca jelas

                particles.rotation.y = THREE.MathUtils.lerp(particles.rotation.y, 0, 0.05); 

                particles.rotation.x = THREE.MathUtils.lerp(particles.rotation.x, 0, 0.05);

            }

            else if (currentShape === 'saturn') { particles.rotation.y -= 0.01; particles.rotation.x = THREE.MathUtils.lerp(particles.rotation.x, 0, 0.1); }

            else if (currentShape === 'heart') { particles.rotation.y += 0.005; particles.rotation.x = THREE.MathUtils.lerp(particles.rotation.x, 0, 0.1); }

            else if (currentShape === 'cloud') { particles.rotation.y += 0.001; }

            else { particles.rotation.x = THREE.MathUtils.lerp(particles.rotation.x, 0, 0.1); particles.rotation.y = THREE.MathUtils.lerp(particles.rotation.y, 0, 0.1); particles.rotation.z = THREE.MathUtils.lerp(particles.rotation.z, 0, 0.1); }

            

            const dustPos = dustParticles.geometry.attributes.position.array;

            const boundary = 250; 

            for(let i = 0; i < dustCount; i++) {

                const ix = i * 3;

                dustPos[ix] += dustVelocities[i].x; dustPos[ix+1] += dustVelocities[i].y; dustPos[ix+2] += dustVelocities[i].z;

                if (dustPos[ix] > boundary) dustPos[ix] = -boundary; else if (dustPos[ix] < -boundary) dustPos[ix] = boundary;

                if (dustPos[ix+1] > boundary) dustPos[ix+1] = -boundary; else if (dustPos[ix+1] < -boundary) dustPos[ix+1] = boundary;

                if (dustPos[ix+2] > boundary) dustPos[ix+2] = -boundary; else if (dustPos[ix+2] < -boundary) dustPos[ix+2] = boundary;

            }

            dustParticles.geometry.attributes.position.needsUpdate = true;



            composer.render();

        }

        animate();

        window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); composer.setSize(window.innerWidth, window.innerHeight); });

    </script>

</body>

</html>



perbaiki bagian deteksi 2 telapak tangan jangan menjadi gambar peta indonesia seperti pada gambar yang saya berikan ini, ingat bentuknya bukan dalam bentuk gambar melainkan partikel kubus-kubus kecil, 