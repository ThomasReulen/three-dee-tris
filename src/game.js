	
GAME.Engine = function(idSelector) {

    if(!THREE) die("three.js not loaded");

    // init 
    this.paused = true;

    window.gameEngine = this;

    // settings holen
    this.settings = window._gameSettings;

    this.materials = this.settings.getMaterials();

    // scrollbalken verhindern
    if(window.innerWidth < this.settings.rendering.stageWidth) this.settings.rendering.stageWidth = window.innerWidth;

    // ratio berechnen
    this.settings.rendering.stageRatio = this.settings.rendering.stageWidth / this.settings.rendering.stageHeight;

    // x-koordinate für linken rand berechnen
    this.deltaXCoord = Math.floor(this.settings.sys.columns/2);

    // camera bewegung
    this.currentRotationAngle = this.settings.rendering.startRotationAngle;
    this.cameraRotation = false;
    this.mouseRightDown = false;
    this.mouseLeftDown = false;
    this.mouseLastPress = { x: 0, y: 0 };

    // texturen laden
    this.textures = this.settings.textures;

    this.registerInputEvents = function() {
        var that = this;

        // events registrieren
        
        window.document.onkeydown = function(e) {
            if(e.keyCode == 27) {
                // menu
                that.togglePause();
                e.preventDefault();
            } else {

                if(!that.paused) {

                    switch(e.keyCode) {
                        // left
                        case 37: 
                            that.gameController.moveCurrentTile('left');
                            break;
                        // up
                        case 38: 
                            that.gameController.moveCurrentTile('up');
                            break;
                        // right
                        case 39: 
                            that.gameController.moveCurrentTile('right');
                            break;
                        // down
                        case 40: 
                            that.gameController.moveCurrentTile('down');
                            break;
                        // down
                        case 32:
                            that.gameController.moveCurrentTile('down');
                            break;
                    }
                    e.preventDefault();
                }
            }
            return true;
        };

        window.document.onmousemove = function(e) {   
            if(that.mouseLeftDown) {
                that.rotateManual(e);
            }

        };

        window.document.onmousedown = function(e) {
            if(e.button === 0) {
                that.mouseLeftDown = true;
                that.mouseLastPress = { x: e.clientX, y: e.clientY };
            } 
            if(e.button === 2) {
               // that.cameraRotation = (that.cameraRotation ? false : true);
            }
            e.preventDefault();
            return false;
        };

        window.document.onmouseup = function(e) {
            that.mouseLeftDown = false;
            e.preventDefault();
        };

        window.document.mousewheel = function(e) {
            var delta = 0;
            var event = e.originalEvent;
            if ( event.wheelDelta !== undefined ) { // WebKit / Opera / Explorer 9
                delta = event.wheelDelta;
            } else if ( event.detail !== undefined ) { // Firefox
                delta = -1 * event.detail;
            }
            that.zoom(delta);
            e.preventDefault();
        };

        return this;

    }

    return this;
};



GAME.Engine.prototype = {

    constructor: GAME.Engine,

    init: function(idSelector) {

        // DOM Refs
        this.idSelector = idSelector;
        this.stage =  this.idSelector ? window.document.getElementById(this.idSelector) : window.document.body;
        this.canvas = window.document.createElement('canvas');
        this.stage.appendChild(this.canvas);

        
        // dialogfenster initialisieren
        this.infoDialog = new GAME.Infodialog('#infodialog');

        // game controller initialisieren
        this.gameController = new GAME.Controller(this);

        // 3D Stage setup - camera, renderer, usw
        this.setupStage();

        // World setup - floor, lights, etc
        this.setupWorld();

        //setup menu 
        this.showMenuScreen();

        return this.registerInputEvents().animate(this);

    },


    setupStage: function() {


        this.camera = new THREE.PerspectiveCamera(  this.settings.rendering.fieldOfView, this.settings.rendering.stageRatio, this.settings.rendering.renderNear, this.settings.rendering.renderFar );
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.x =  0;
        this.camera.rotation.y =  0;
        this.camera.rotation.z = 0;
        this.camera.up = new THREE.Vector3(0,0,1);

        this.setPlayCamera();

        this.scene = new THREE.Scene();
        this.scene.add(this.camera);

        if (window.WebGLRenderingContext)
            this.renderer = new THREE.WebGLRenderer({canvas:this.canvas});
        else
            this.renderer = new THREE.CanvasRenderer({canvas:this.canvas});

        this.renderer.shadowMapEnabled = true;
        this.renderer.shadowMapSoft = true;
        this.renderer.setSize( this.settings.rendering.stageWidth, this.settings.rendering.stageHeight );
        
        var DPR = (window.devicePixelRatio) ? window.devicePixelRatio : 1;
        var WW = window.innerWidth;
        var HH = window.innerHeight;
        //this.renderer.setViewport( 0, 0, WW*DPR, HH*DPR );

        // this.el.appendChild( this.renderer.domElement );


    },


    setupWorld: function() {        

        if(this.settings.world.showWorldBox) {

            var worldboxmaterial = new THREE.MeshPhongMaterial( { map: this.textures.get('worldbox') } );
            worldboxmaterial.side = THREE.DoubleSide;

            var worldCube = new THREE.BoxGeometry(800,800,800);
            var cubeMesh = new THREE.Mesh (worldCube,worldboxmaterial);
            cubeMesh.position.set( 0,0,0 );
            this.scene.add( cubeMesh );
        }


        this.scene.fog = new THREE.Fog( this.settings.world.fogColor, this.settings.world.fogNear, this.settings.world.fogFar );


        if(this.renderer instanceof THREE.CanvasRenderer) {

        } else {

            // add floor

            var floortexture = this.textures.get( this.settings.world.floorTexture );
            floortexture.wrapS = floortexture.wrapT = THREE.RepeatWrapping;
            floortexture.repeat.set( this.settings.world.floorTextureRepeat.x, this.settings.world.floorTextureRepeat.y );
            var geometry = new THREE.PlaneBufferGeometry( this.settings.world.floorSize.x, this.settings.world.floorSize.y );
            var floormaterial = new THREE.MeshPhongMaterial( { map: floortexture } );
            floormaterial.needsUpdate = true;
            var floormesh = new THREE.Mesh( geometry, floormaterial );
            floormesh.receiveShadow = true;
            floormesh.position.set(this.deltaXCoord,0,-0.5);
            this.scene.add( floormesh );
            
            if(this.settings.world.ambientLight) {
                // add scene lights     
                var ambient = new THREE.AmbientLight( this.settings.world.ambientLightColor, this.settings.world.ambientLightIntensity );
                this.scene.add( ambient );
            }

            this.sceneLights = [];
            this.sceneLightTargets = [];
            for(var i = 0; i < this.settings.world.lights.length; i++) {
                this.sceneLights[i] = new THREE.SpotLight( this.settings.world.lights[i].color, this.settings.world.lights[i].intensity ); // 0x775522 - 2.5
                this.sceneLights[i].position.copy( this.settings.world.lights[i].position );
                this.sceneLights[i].castShadow = this.settings.world.lights[i].castShadow;
                this.sceneLights[i].shadowCameraNear = this.settings.world.lights[i].shadowCameraNear;
                this.sceneLights[i].shadowCameraFar = this.settings.world.lights[i].shadowCameraFar;
                this.sceneLights[i].shadowCameraFov = this.settings.world.lights[i].shadowCameraFov;
                this.sceneLights[i].shadowMapBias = this.settings.world.lights[i].shadowMapBias;
                this.sceneLights[i].shadowDarkness = this.settings.world.lights[i].shadowDarkness;
                this.sceneLights[i].shadowMapWidth = this.settings.world.lights[i].shadowMapWidth;
                this.sceneLights[i].shadowMapHeight = this.settings.world.lights[i].shadowMapHeight;
                this.sceneLightTargets[i] = new THREE.Object3D();
                this.sceneLightTargets[i].position.copy( this.settings.world.lights[i].target );
                this.sceneLights[i].target = this.sceneLightTargets[i];
                this.scene.add(this.sceneLights[i]);
                this.scene.add(this.sceneLightTargets[i]);
            }

        }
    },

    showMenuScreen: function() {
        // do sth
        this.setRotationCamera();
    },


    // ANIMATION AND RENDERING 
    animate: function(ref) {

        window.requestAnimationFrame( function() { ref.animate(ref); } );
        this.render(Date.now());
    },

    render: function(dt) {

       if(!this.mouseLeftDown && this.cameraRotation) {
            this.currentRotationAngle +=  this.settings.rendering.cameraRotationSpeed;
            this.rotateCamera();
       }

        
        if(!this.paused) {
            // this.setupDebug();
            this.gameController.render(dt);
        } 
        this.renderer.render( this.scene, this.camera );

    },




    hideMenuScreen: function() {
        this.gameController.newGame();
        //this.scene.remove(this.logoObj);
    },


    rotateCamera: function() {
        this.camera.position.y = this.settings.rendering.cameraRotationTarget.y + this.settings.rendering.cameraMoveRadius * Math.sin(this.currentRotationAngle);         
        this.camera.position.x = this.settings.rendering.cameraRotationTarget.x + this.settings.rendering.cameraMoveRadius * Math.cos(this.currentRotationAngle);
        this.camera.lookAt( this.settings.rendering.cameraRotationTarget );
    },

    setPlayCamera: function() {
        this.cameraRotation = false;
        this.camera.position.copy ( this.settings.rendering.cameraPlayPosition );
        this.camera.lookAt( this.settings.rendering.cameraPlayTarget ); 
    },

    setRotationCamera: function() {
        this.camera.position.copy( this.settings.rendering.cameraRotationPosition );
        this.cameraRotation = true;
    },

    rotateManual: function(e) {
        this.currentRotationAngle +=  -1 * ( e.clientX - this.mouseLastPress.x ) * 0.01;
        this.mouseLastPress.x = e.clientX;
        this.rotateCamera();
    },

    zoom: function(delta) {

        if(delta < 0) {
            this.settings.rendering.cameraMoveRadius += 8;
        } else {
            this.settings.rendering.cameraMoveRadius -= 8;

        }
        this.rotateCamera();


    },

    togglePause: function() {

        if(this.paused) {
            this.paused = false;
            this.hideMenuScreen();
            this.setPlayCamera();
        } else {
            this.paused = true;
            this.showMenuScreen();
            this.setRotationCamera();
        }

        return this;
    }





};