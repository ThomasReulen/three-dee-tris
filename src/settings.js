window._gameSettings = {



        game: {
            startLevel: 1,
            pointsPerLine: 10,
            stages: [
                { lvl: 1, speed: 1000, points: 100 },
                { lvl: 2, speed: 900, points: 200 },
                { lvl: 3, speed: 800, points: 300 },
                { lvl: 4, speed: 700, points: 400 },
                { lvl: 5, speed: 600, points: 500 },
                { lvl: 6, speed: 500, points: 600 },
                { lvl: 7, speed: 400, points: 700 },
                { lvl: 8, speed: 300, points: 800 }
            ]
        },

        rendering: {
            stageWidth: 950,
            stageHeight: window.innerHeight - 30,
            fieldOfview: 45,
            renderNear: 0.5,
            renderFar: 100,
            cameraPlayPosition: new THREE.Vector3( 0,-25,25 ),
            cameraPlayTarget: new THREE.Vector3( 4,10,3 ),
            cameraRotationPosition: new THREE.Vector3( 10,-35,20 ),
            cameraRotationTarget: new THREE.Vector3( 6,0,5 ),
            cameraMoveRadius: 35,
            cameraRotationSpeed: 0.001,
            startRotationAngle: 4
        },

        sys: {
            columns: 13,
            maxBottom: 0,
            maxTop: 20,
            spawnHeight: 16, // normal: 16
            stagePositionY: -2,
            boxSize: { x: 1, y: 1, z: 1} // normal: 0.97
        },

        world: {

            fogColor: 0x000000,
            fogNear: 5,
            fogFar: 85,

            ambientLight: true,
            ambientLightColor: 0xbbbbbb,
            ambientLightIntensity: 0.4,

            lights: [
                {
                    position: new THREE.Vector3( 0,-25,30 ),
                    target: new THREE.Vector3( 0,0,0 ),
                    color: 0xffffff,
                    intensity: 1.5,
                    castShadow: true,
                    exponent: 5,
                    shadowCameraNear: 1,
                    shadowCameraFar: 120,
                    shadowCameraFov: 120,
                    shadowMapBias: 0.5,
                    shadowDarkness: 0.5,
                    shadowMapWidth: 1024,
                    shadowMapHeight: 1024
                },
                {
                    position: new THREE.Vector3( 11,-25,30 ),
                    target: new THREE.Vector3( 15,2,2 ),
                    color: 0xffffff,
                    intensity: 1.5,
                    castShadow: true,
                    exponent: 5,
                    shadowCameraNear: 1,
                    shadowCameraFar: 120,
                    shadowCameraFov: 120,
                    shadowMapBias: 0.5,
                    shadowDarkness: 0.5,
                    shadowMapWidth: 1024,
                    shadowMapHeight: 1024
                }

            ],

            floorTexture: 'floor',
            floorTextureRepeat: { x: 8, y: 8 },
            floorSize: { x: 60, y: 60 },
            floorShininess: 5
            
        },


        textures: {

            imgs: { 
                    // 'ele1' : THREE.ImageUtils.loadTexture( "/assets/img/ele1.jpg" ),
                    // 'ele2' : THREE.ImageUtils.loadTexture( "/assets/img/ele2.jpg" ),
                    // 'ele3' : THREE.ImageUtils.loadTexture( "/assets/img/ele3.jpg" ),
                    // 'ele4' : THREE.ImageUtils.loadTexture( "/assets/img/ele4.jpg" ),
                    'box'  : THREE.ImageUtils.loadTexture( "/assets/img/box.jpg" ),
                    'box1' : THREE.ImageUtils.loadTexture( "/assets/img/box1.jpg" ),
                    'box2' : THREE.ImageUtils.loadTexture( "/assets/img/box2.jpg" ),
                    'box3' : THREE.ImageUtils.loadTexture( "/assets/img/box3.jpg" ),
                    'bricks' : THREE.ImageUtils.loadTexture( "/assets/img/bricks.jpg" ),
                    'floor' : THREE.ImageUtils.loadTexture( "/assets/img/floor.jpg" ),
                    'worldbox' : THREE.ImageUtils.loadTexture( "/assets/img/box_brushed.jpg" ),
                    'logobox' : THREE.ImageUtils.loadTexture( "/assets/img/box_brushed.jpg" ),
                    'text' : THREE.ImageUtils.loadTexture( "/assets/img/box_brushed.jpg" ),
                    //'brushedlogo' : THREE.ImageUtils.loadTexture( "/assets/img/contens_brushed.jpg"  )
                  },

            get: function(t) {
                return this.imgs[t];
            }
        }, 

        getMaterials: function() {

            var mats = {
                'simpleGrey': new THREE.MeshPhongMaterial( { color: '#333333', ambient: '#333333', shininess: 8 } ),
                'darkGreen': new THREE.MeshPhongMaterial( { color: '#B4D802', ambient: '#B4D802', shininess: 8 } ),
                'lightGreen': new THREE.MeshPhongMaterial( { color: '#447A1C', ambient: '#447A1C',  shininess: 8 } ),
                't-1': new THREE.MeshPhongMaterial( { map: this.textures.get('logobox'), color: '#333333', ambient: '#333333', shininess: 8 } ),
                't-2': new THREE.MeshPhongMaterial( { map: this.textures.get('logobox'), color: '#B4D802', ambient: '#B4D802', shininess: 8 } ),
                't-3': new THREE.MeshPhongMaterial( { map: this.textures.get('logobox'), color: '#447A1C', ambient: '#447A1C', shininess: 8 } ),
                't-4': new THREE.MeshPhongMaterial( { color: '#B4D802', ambient: '#B4D802', shininess: 8 } )
            };

            return mats;

        },

        getLogoObject: function() {


            var logoObj = new THREE.Object3D();


            return logoObj;
        }


    };