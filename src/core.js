


GAME = {
    version: "0.1"
};

GAME.Infodialog = function(el) {

    var dialog = window.document.createElement('div');
    var txt = window.document.createTextNode('[space] play/pause --- [click] rotate --- [wheel] zoom');
    dialog.setAttribute('class','infobar');
    dialog.appendChild(txt);
    
    window.document.body.appendChild(dialog);

    return this;
};

GAME.Infodialog.prototype = {
    constructor: GAME.Infodialog

};



GAME.Controller = function(engine, settings) {

    this._engine = engine;
    this._settings = this._engine.settings;
    this._maxTop = this._engine.settings.sys.maxTop;
    this._maxBottom = this._engine.settings.sys.maxBottom;
    this._spawnHeight = this._engine.settings.sys.spawnHeight;
    this._columns = this._settings.sys.columns;
    this._stageY = this._settings.sys.stagePositionY;

    // init
    this.t = Date.now();
    this.cycle = 0;
    this.tiles = [];
    this.aLines = [];
    this.aCompleteLines = [];
    this.controls = 0;
    this.deltaXCoord = this._engine.deltaXCoord;
    
    // Zeilen und Spalten für Spiel berechnen, spiele-grid aLInes erstellen
    this.maxLines = this._maxTop-this._maxBottom;
    this.gameColumnNumber = this._settings.sys.columns-1;

    for(var l = 0; l < this.maxLines; l++) {
        this.aLines.push([]);
        for(var i = 0; i <= this.gameColumnNumber; i++) {
            this.aLines[this.aLines.length-1][i] = {};
        }
    }

    // startlevel setzen
    this.currentLevel = this._settings.game.stages[this._settings.game.startLevel-1];
    this.currentPoints = 0;


    this.guiBoxGeometry = new THREE.BoxGeometry(0.5,1,this._spawnHeight);
    this.guiMaterial = new THREE.MeshPhongMaterial( { color: '#333333', ambient: '#333333', shininess: 8 } );
    this.textMaterial1 = new THREE.MeshPhongMaterial( { color: '#B4D802', ambient: '#B4D802', shininess: 8 } );
    this.textMaterial2 = new THREE.MeshPhongMaterial( { color: '#447A1C', ambient: '#447A1C',  shininess: 8 } );

    return this;
};

GAME.Controller.prototype = {

    constructor: GAME.Controller,

    render: function(dt) {

        if((dt - this.t) > this.currentLevel.speed) {
            this.tick().clearLines().updateInfo();
            this.t = dt;
        }

    },

    tick: function() {

        if(!this.paused) {
            this.cycle++;
            if(this.tiles.length > 0) {
                this.moveTiles();
            } else {
                this.newTile();
            }
        }

        return this;

    },

    updateGuiInfos: function() {

        this.guiObject.remove(this.levelTextMesh);
        this.guiObject.remove(this.pointsTextMesh);

        this.levelTextGeom = new THREE.TextGeometry( 'Level: '+this.currentLevel.lvl, {
            size: 1, //text size
            height: 0.2, //thicknes of text's extrude!
            curveSegments: 8,
            font: 'helvetiker', 
            weight: 'normal',
            style: 'normal'
        });

        this.pointsTextGeom = new THREE.TextGeometry( 'Points: '+this.currentPoints, {
            size: 1, //text size
            height: 0.2, //thicknes of text's extrude!
            curveSegments: 8,
            font: 'helvetiker', 
            weight: 'normal',
            style: 'normal'
        });
        
        this.levelTextMesh = new THREE.Mesh( this.levelTextGeom, this.textMaterial1 );
        this.levelTextMesh.castShadow = true;
        this.levelTextMesh.position.set( -8,this._stageY, this._spawnHeight+1.5 ); 
        this.levelTextMesh.rotation.x += 90 * Math.PI / 180;

        this.pointsTextMesh = new THREE.Mesh( this.pointsTextGeom, this.textMaterial2 );
        this.pointsTextMesh.castShadow = true;
        this.pointsTextMesh.position.set( -8,this._stageY, this._spawnHeight ); 
        this.pointsTextMesh.rotation.x += 90 * Math.PI / 180;

        this.guiObject.add( this.levelTextMesh );      
        this.guiObject.add( this.pointsTextMesh );    

    },

    initGui: function() {

        this.guiObject = new THREE.Object3D();


        this.guiLeftMesh = new THREE.Mesh( this.guiBoxGeometry, this.guiMaterial );
        this.guiLeftMesh.castShadow = true;
        this.guiLeftMesh.position.set( -1,this._stageY,Math.floor((this._spawnHeight+1)/2)-1 );

        this.guiRightMesh = new THREE.Mesh( this.guiBoxGeometry, this.guiMaterial );
        this.guiRightMesh.castShadow = true;
        this.guiRightMesh.position.set( this._columns,this._stageY,Math.floor((this._spawnHeight+1)/2)-1);

    
        this.guiObject.add(this.guiLeftMesh);
        this.guiObject.add(this.guiRightMesh);
        
        this.updateGuiInfos(this.currentLevel,this.currentPoints);

        this.stageObject.add(this.guiObject);

    },

    newGame: function() {
        this._engine.scene.remove(this.stageObject);

        this.stageObject = new THREE.Object3D();

        this.initGui();

        this._engine.scene.add(this.stageObject);

    },



    moveCurrentTile: function(dir) {
        
        if(this.tiles.length) {

            var tile = this.tiles[this.tiles.length-1]; 

            switch(dir) {
                case 'left': 
                if(tile.getLeftmost().aCol > 0) {
                    tile.moveLeft();
                }
                break;
                // up
                case 'up': 
                tile.rotate();
                break;
                // right
                case 'right': 
                if(tile.getRightmost().aCol < this.gameColumnNumber) {
                    tile.moveRight();
                }
                break;
                // down
                case 'down': 
                tile.drop();
                break;
                // down
                case 'down': 
                tile.drop();
                break;
            }

        }


    },

    clearLines: function() {
        
        for(var l = 0; l < this.aLines.length; l++) {

            var filleds = 0;
            var line = this.aLines[l];

            if( (line[0] instanceof GAME.Box) && (line[line.length-1] instanceof GAME.Box)) 
            {   
                
                filleds = 2;
                for(c = 1; c < line.length-1; c++) {
                    if(line[c] instanceof GAME.Box) filleds++;
                }
                if(filleds == line.length) {
                    this.clearLine(line).shiftLines(l).clearLines();
                }

            }
        }
        return this;

    },

    clearLine: function(line) {

        for(var j = 0; j < line.length; j++) {

            var b = line[j];
            this._engine.scene.remove(b.mesh);
            b._tile.removeBox(b.boxID);
            line[j] = {};
         }

         this.currentPoints += this._settings.game.pointsPerLine;


        return this;
    },

    shiftLines: function(toLine) {

        var line = 0;
        var aOlds = [];

        for(var i = toLine+1; i < this.aLines.length-1; i++) {

            line = this.aLines[i];

            for(var c = 0; c < line.length; c++) {
            
                if(line[c] instanceof GAME.Box) {

                    line[c].setPos( line[c].aCol, line[c].aLine-1);
                    line[c] = {};

                    
            
                } else {
                   
                }
            
            }
        }

        return this;

    },

    updateInfo: function() {

        if((this.currentPoints >= this.currentLevel.points) && (this._settings.game.stages[this.currentLevel.lvl])) {
            this.currentLevel = this._settings.game.stages[this.currentLevel.lvl];
        }

        this.updateGuiInfos();

    },



    triggerNew: function() {
        for(var i = 0; i < this.aLines[this._spawnHeight].length; i++) {
            if(this.aLines[this._spawnHeight][i] instanceof GAME.Box) {
                this.gameOver();
            }
        }
        var newTile = 0;
        
        var rnd = Math.floor(Math.random() * ((7-1)+1) + 1);
        //rnd = 5;

        switch(rnd) {
            case 1: newTile = new GAME.TileT(this.deltaXCoord,this._stageY,this._spawnHeight).create(); break;
            case 2: newTile = new GAME.TileLR(this.deltaXCoord,this._stageY,this._spawnHeight).create(); break;
            case 3: newTile = new GAME.TileLL(this.deltaXCoord,this._stageY,this._spawnHeight).create(); break;
            case 4: newTile = new GAME.TileO(this.deltaXCoord,this._stageY,this._spawnHeight).create(); break;
            case 5: newTile = new GAME.TileI(this.deltaXCoord,this._stageY,this._spawnHeight).create(); break;
            case 6: newTile = new GAME.TileZR(this.deltaXCoord,this._stageY,this._spawnHeight).create(); break;
            case 7: newTile = new GAME.TileZL(this.deltaXCoord,this._stageY,this._spawnHeight).create(); break;
        }

        //newTile = new GAME.TileT(this.deltaXCoord,this._stageY,this._spawnHeight-4).create();

        this.tiles.push( newTile );
        newTile.addToScene();


    },

    newTile: function() {
        this.clearLines().triggerNew();
    },

    gameOver: function() {
        this._engine.paused = true;
        this._engine.cameraRotation = true;
    },

    moveTiles: function() {
        if(this.tiles.length) {
            var tile = this.tiles[this.tiles.length-1];
            if(tile.getDownmost().aLine <= this._settings.sys.maxBottom) {
                this.newTile();
            } else {
                tile.moveDown();
            }
        }
    }


};




GAME.Box = function(x,y,z) {
    this.aCol = 0;
    this.aLine = 0;
    this.pos = new THREE.Vector3(x,y,z);
    this.mesh = {};
    this.tileID = 0;
    this.boxID = 0;
    this._tile = 0;
    return this;
};

GAME.Box.prototype = {
        
        constructor: GAME.Box,

        create: function(boxID,tileID,tile,texture) {
            this.tileID = tileID;
            this.boxID = boxID;
            this._tile = tile;

                this.boxtexture = window.gameEngine.gameController._settings.textures.get(texture);
                this.boxmaterial = new THREE.MeshPhongMaterial( { map: this.boxtexture } );
                /*
            if(texture == 'bricks' || texture == 'box' ) {
                this.boxmaterial = this._tile._gameCtrl._engine.materials['t-1']; // grey
            } else if (texture == 'box1') {
                this.boxmaterial = this._tile._gameCtrl._engine.materials['t-2']; // dark green
            } else if (texture == 'box2' || texture == 'box3') {
                this.boxmaterial = this._tile._gameCtrl._engine.materials['t-3']; // lght green
            } else {
                this.boxtexture = window.gameEngine.gameController._settings.textures.get(texture);
                this.boxmaterial = new THREE.MeshPhongMaterial( { map: this.boxtexture } );
            }
*/
            this.boxmaterial.needsUpdate = true;
            
            var boxGeometry = new THREE.BoxGeometry(window.gameEngine.gameController._settings.sys.boxSize.x,window.gameEngine.gameController._settings.sys.boxSize.y,window.gameEngine.gameController._settings.sys.boxSize.z);
            boxGeometry.buffersNeedUpdate = true;
            boxGeometry.uvsNeedUpdate = true;
            this.mesh = new THREE.Mesh( boxGeometry, this.boxmaterial );
            this.mesh.castShadow = true;
            this.mesh.receiveShadow = false;
            this.setMeshPos();
            return this;
        },

        setMeshPos: function() { 

            var ret = {line: this.aLine, col: this.aCol};
            this.mesh.position.copy( this.pos );
            this.aLine = this.pos.z;
            this.aCol = this.pos.x;
            
            window.gameEngine.gameController.aLines[this.aLine][this.aCol] = this;
            
            return ret;

        },

        rotate: function() {

            this.mesh.rotation.y += 90 * Math.PI / 180;

        },

        getLeftNeighbour: function() {
            return window.gameEngine.gameController.aLines[this.aLine][this.aCol-1];
        },

        getRightNeighbour: function() {
             return window.gameEngine.gameController.aLines[this.aLine][this.aCol+1];

        },

        getBottomNeighbour: function() {
            if(this.aLine > 0) {

                return window.gameEngine.gameController.aLines[this.aLine-1][this.aCol];

            } else {
                return {};
            }

        },

        move: function(dir,a) {
            if(!a) a = 1;
            switch(dir) {
                // left
                case 0: 
                this.pos.x -= a;
                break;
                // up
                case 1: 
                // this.pos.z += a;
                break;
                // right
                case 2: 
                this.pos.x += a;
                break;
                // down
                case 3: 
                this.pos.z -= a;
                break;
            }
            return this.setMeshPos();
        },

        setPos: function(x,z) {
            this.pos.x = x;
            this.pos.z = z;
            return this.setMeshPos();
        }

};





GAME.Tile = function(x,y,z) {


};

GAME.Tile.prototype = {

        constructor: GAME.Tile,

        create: function() {

            return this;
        },

        removeBox: function(id) {

            for(var i = 0; i < this.boxes.length; i++) {
                if(this.boxes[i].boxID == id) {
                    this.boxes.splice(i,1);
                    break;
                }
            }

            return this;

        },

        init: function(x,y,z) {
            this._gameCtrl = window.gameEngine.gameController;
            this.pos = {x:x,y:y,z:z};
            this.boxes = [];
            this.downmost = 0;
            this.upmost = 0;
            this.leftmost = 0;
            this.rightmost = 0;
            this.tileID = this._gameCtrl.cycle;
            this.rotationState = 1;
        },

        getMeshes: function() {
            return this.boxes;
        },

        calcCorners: function() {
            for(var i = 1; i < this.boxes.length; i++) {
                
                if(this.boxes[i].aLine < this.boxes[this.downmost].aLine) {
                    this.downmost = i;
                }
                if(this.boxes[i].aLine > this.boxes[this.upmost].aLine) {
                    this.upmost = i;
                }
                if(this.boxes[i].aCol < this.boxes[this.leftmost].aCol) {
                    this.leftmost = i;
                }
                if(this.boxes[i].aCol > this.boxes[this.rightmost].aCol) {
                    this.rightmost = i;
                }
            
            }
        },

        getDownmost: function() {
            return this.boxes[this.downmost];
        },

        getUpmost: function() {
            return this.boxes[this.upmost];
        },

        getLeftmost: function() {
            return this.boxes[this.leftmost];
        },

        getRightmost: function() {
            return this.boxes[this.rightmost];
        },

        detectCollusion: function(dir) {
            ret = false;
            for(var i = 0; i < this.boxes.length; i++) {
                var neighbour = 0;
                switch(dir) {
                    case 3:
                    neighbour = this.boxes[i].getBottomNeighbour();
                    break;
                    case 0:
                    neighbour = this.boxes[i].getLeftNeighbour();
                    break;
                    case 2:
                    neighbour = this.boxes[i].getRightNeighbour();
                    break;
                }
                if((neighbour instanceof GAME.Box) && (neighbour.tileID != this.tileID)) {

                    ret = true;
                } 

            }
            return ret;

        },

        moveDown: function() {
            if(this.detectCollusion(3)) {

                this._gameCtrl.newTile();
                

            } else {
                var aOlds = [];
                for(var i = 0; i < this.boxes.length; i++) {

                    aOlds.push(this.boxes[i].move(3));
                }
                this.clearOlds(aOlds);
                this.calcCorners();
            }
        },

        moveLeft: function() {
            if(this.detectCollusion(0)) {

            } else {
                var aOlds = [];
                for(var i = 0; i < this.boxes.length; i++) {
                    aOlds.push(this.boxes[i].move(0));
                }
                this.clearOlds(aOlds);
                this.calcCorners();
            }
        },

        moveRight: function() {
            if(this.detectCollusion(2)) {
                //console.log('col detected');

            } else {
                var aOlds = [];
                for(var i = 0; i < this.boxes.length; i++) {
                    aOlds.push(this.boxes[i].move(2));
                }
                this.clearOlds(aOlds);
                this.calcCorners();
            }

        },

        clearOlds: function(aOlds) {

            for(var i = 0; i < aOlds.length; i++) {

                var ref = this._gameCtrl.aLines[aOlds[i].line][aOlds[i].col];

                if( (ref.aLine != aOlds[i].line) || (ref.aCol != aOlds[i].col) ) {
                    this._gameCtrl.aLines[aOlds[i].line][aOlds[i].col] = {};
                }
                

            }

        },

        rotate: function() {

            // todo ?? 

            return this;

        },

        checkRotationPoints: function(aPoints) {

            for(var i = 0; i < aPoints.length; i++) {
                if(aPoints[i][0] < 0 || aPoints[i][0] > this._columns -1) {
                    return true;
                }
                pointRef = this._gameCtrl.aLines[aPoints[i][1]][aPoints[i][0]];
                if((pointRef instanceof GAME.Box) && (pointRef.tileID != this.tileID)) {
                    return true;
                }
            }

            return false;

        },

        drop: function() {
            while(!this.detectCollusion(3)) {
                this.moveDown();
                if(this.getDownmost().aLine <= 0) break;
            }
        },

        addToScene: function() {
            for(var i = 0; i < this.boxes.length; i++) {
                this._gameCtrl._engine.scene.add(this.boxes[i].mesh);
            }
        },



};

GAME.TileT = function(x,y,z) { 
    this.init(x,y,z);

};

GAME.TileT.prototype = Object.create( GAME.Tile.prototype );
GAME.TileT.prototype.constructor = GAME.TileT;
GAME.TileT.prototype.create = function() {

    this.boxes.push( new GAME.Box(this.pos.x,this.pos.y,this.pos.z).create(1,this.tileID,this,'box') );
    this.boxes.push( new GAME.Box(this.pos.x-1,this.pos.y,this.pos.z).create(2,this.tileID,this,'box') );
    this.boxes.push( new GAME.Box(this.pos.x,this.pos.y,this.pos.z+1).create(3,this.tileID,this,'box') );
    this.boxes.push( new GAME.Box(this.pos.x+1,this.pos.y,this.pos.z).create(4,this.tileID,this,'box') );
    this.calcCorners();
    return this;
};

GAME.TileT.prototype.rotate = function() {

    var c = this.boxes[0].aCol;
    var l = this.boxes[0].aLine;
    var aOlds = [];
    

    if(this.rotationState == 1) {
        if(!this.checkRotationPoints([ [this.boxes[1].aCol+1,this.boxes[1].aLine+1], [this.boxes[2].aCol+1, this.boxes[2].aLine-1], [this.boxes[3].aCol-1, this.boxes[3].aLine-1] ])) 
        {
            this.rotationState = 2;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol+1, this.boxes[1].aLine+1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol+1, this.boxes[2].aLine-1 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol-1, this.boxes[3].aLine-1 ) );
            this.clearOlds(aOlds);
            this.calcCorners();
        }
    } else  if(this.rotationState == 2) {
        if(!this.checkRotationPoints([ [this.boxes[1].aCol+1, this.boxes[1].aLine-1], [this.boxes[2].aCol-1, this.boxes[2].aLine-1], [this.boxes[3].aCol-1, this.boxes[3].aLine+1] ])) 
        {
            this.rotationState = 3;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol+1, this.boxes[1].aLine-1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol-1, this.boxes[2].aLine-1 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol-1, this.boxes[3].aLine+1 ) );
            this.clearOlds(aOlds);
            this.calcCorners();
        }
    } else  if(this.rotationState == 3) {
        if(!this.checkRotationPoints([ [this.boxes[1].aCol-1, this.boxes[1].aLine-1 ],[this.boxes[2].aCol-1, this.boxes[2].aLine+1],[this.boxes[3].aCol+1, this.boxes[3].aLine+1] ])) 
        {
            this.rotationState = 4;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol-1, this.boxes[1].aLine-1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol-1, this.boxes[2].aLine+1 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol+1, this.boxes[3].aLine+1 ) );
            this.clearOlds(aOlds);
            this.calcCorners();
        }

    } else if(this.rotationState == 4) {
        if(!this.checkRotationPoints([ [this.boxes[1].aCol-1, this.boxes[1].aLine+1],[this.boxes[2].aCol+1, this.boxes[2].aLine+1],[this.boxes[3].aCol+1, this.boxes[3].aLine-1] ])) 
        {
            this.rotationState = 1;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol-1, this.boxes[1].aLine+1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol+1, this.boxes[2].aLine+1 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol+1, this.boxes[3].aLine-1 ) );
            this.clearOlds(aOlds);
            this.calcCorners();
            }
    }
    return this;
};


GAME.TileI = function(x,y,z) { 
    this.init(x,y,z);

};

GAME.TileI.prototype = Object.create( GAME.Tile.prototype );
GAME.TileI.prototype.constructor = GAME.TileI;
GAME.TileI.prototype.create = function() {

    this.boxes.push( new GAME.Box(this.pos.x,this.pos.y,this.pos.z+3).create(1,this.tileID,this,'bricks') );
    this.boxes.push( new GAME.Box(this.pos.x,this.pos.y,this.pos.z+2).create(2,this.tileID,this,'bricks') );
    this.boxes.push( new GAME.Box(this.pos.x,this.pos.y,this.pos.z+1).create(3,this.tileID,this,'bricks') );
    this.boxes.push( new GAME.Box(this.pos.x,this.pos.y,this.pos.z).create(4,this.tileID,this,'bricks') );
    this.calcCorners();
    return this;
};

GAME.TileI.prototype.rotate = function() {

    var c = this.boxes[0].aCol;
    var l = this.boxes[0].aLine;
    var aOlds = [];
    

    if(this.rotationState == 1) {
        if(!this.checkRotationPoints([ [this.boxes[1].aCol-1, this.boxes[1].aLine+1], [this.boxes[2].aCol+1, this.boxes[2].aLine+2], [this.boxes[3].aCol+2, this.boxes[3].aLine+3 ] ])) 
        {
            this.rotationState = 2;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol-1, this.boxes[1].aLine+1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol+1, this.boxes[2].aLine+2 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol+2, this.boxes[3].aLine+3 ) );
            this.clearOlds(aOlds);
            this.calcCorners();
        }
    } else  if(this.rotationState == 2) {
        if(!this.checkRotationPoints([ [this.boxes[1].aCol+1, this.boxes[1].aLine-1], [this.boxes[2].aCol-1, this.boxes[2].aLine-2], [this.boxes[3].aCol-2, this.boxes[3].aLine-3] ])) 
        {
            this.rotationState = 1;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol+1, this.boxes[1].aLine-1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol-1, this.boxes[2].aLine-2 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol-2, this.boxes[3].aLine-3 ) );
            this.clearOlds(aOlds);
            this.calcCorners();
        }
    } 
    return this;
};



GAME.TileLL = function(x,y,z) { 
    this.init(x,y,z);

};

GAME.TileLL.prototype = Object.create( GAME.Tile.prototype );
GAME.TileLL.prototype.constructor = GAME.TileLL;
GAME.TileLL.prototype.create = function() {

    this.boxes.push( new GAME.Box(this.pos.x,this.pos.y,this.pos.z).create(1,this.tileID,this,'box1') );
    this.boxes.push( new GAME.Box(this.pos.x,this.pos.y,this.pos.z-1).create(2,this.tileID,this,'box1') );
    this.boxes.push( new GAME.Box(this.pos.x,this.pos.y,this.pos.z+1).create(3,this.tileID,this,'box1') );
    this.boxes.push( new GAME.Box(this.pos.x+1,this.pos.y,this.pos.z+1).create(4,this.tileID,this,'box1') );
    this.calcCorners();
    return this;
};

GAME.TileLL.prototype.rotate = function() {

    var c = this.boxes[0].aCol;
    var l = this.boxes[0].aLine;
    var aOlds = [];
    

    if(this.rotationState == 1) {
        if(!this.checkRotationPoints([ [this.boxes[1].aCol-1, this.boxes[1].aLine+1], [this.boxes[2].aCol+1, this.boxes[2].aLine-1], [this.boxes[3].aCol, this.boxes[3].aLine-2] ])) 
        {
            this.rotationState = 2;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol-1, this.boxes[1].aLine+1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol+1, this.boxes[2].aLine-1 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol, this.boxes[3].aLine-2 ) );
            this.clearOlds(aOlds);
            this.calcCorners();
        }
    } else  if(this.rotationState == 2) {	
        if(!this.checkRotationPoints([ [this.boxes[1].aCol+1, this.boxes[1].aLine+1], [this.boxes[2].aCol-1, this.boxes[2].aLine-1], [this.boxes[3].aCol-2, this.boxes[3].aLine] ])) 
        {
            this.rotationState = 3;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol+1, this.boxes[1].aLine+1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol-1, this.boxes[2].aLine-1 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol-2, this.boxes[3].aLine ) );
            this.clearOlds(aOlds);
            this.calcCorners();
        }
    } else  if(this.rotationState == 3) {
        if(!this.checkRotationPoints([ [this.boxes[1].aCol+1, this.boxes[1].aLine-1], [this.boxes[2].aCol-1, this.boxes[2].aLine+1], [this.boxes[3].aCol, this.boxes[3].aLine+2] ])) 
        {
            this.rotationState = 4;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol+1, this.boxes[1].aLine-1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol-1, this.boxes[2].aLine+1 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol, this.boxes[3].aLine+2 ) );
            this.clearOlds(aOlds);
            this.calcCorners();
        }

    } else if(this.rotationState == 4) {
        if(!this.checkRotationPoints([ [this.boxes[1].aCol-1, this.boxes[1].aLine-1], [this.boxes[2].aCol+1, this.boxes[2].aLine+1], [this.boxes[3].aCol+2, this.boxes[3].aLine] ])) 
        {
            this.rotationState = 1;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol-1, this.boxes[1].aLine-1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol+1, this.boxes[2].aLine+1 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol+2, this.boxes[3].aLine ) );
            this.clearOlds(aOlds);
            this.calcCorners();
        }
    }
    return this;
};






GAME.TileLR = function(x,y,z) { 
    this.init(x,y,z);

};

GAME.TileLR.prototype = Object.create( GAME.Tile.prototype );
GAME.TileLR.prototype.constructor = GAME.TileLR;
GAME.TileLR.prototype.create = function() {

    this.boxes.push( new GAME.Box(this.pos.x,this.pos.y,this.pos.z).create(1,this.tileID,this,'box1') );
    this.boxes.push( new GAME.Box(this.pos.x,this.pos.y,this.pos.z-1).create(2,this.tileID,this,'box1') );
    this.boxes.push( new GAME.Box(this.pos.x,this.pos.y,this.pos.z+1).create(3,this.tileID,this,'box1') );
    this.boxes.push( new GAME.Box(this.pos.x-1,this.pos.y,this.pos.z+1).create(4,this.tileID,this,'box1') );


    this.calcCorners();
    return this;
};

GAME.TileLR.prototype.rotate = function() {

    var c = this.boxes[0].aCol;
    var l = this.boxes[0].aLine;
    var aOlds = [];
    

    if(this.rotationState == 1) {
        if(!this.checkRotationPoints([ [this.boxes[1].aCol-1, this.boxes[1].aLine+1], [this.boxes[2].aCol+1, this.boxes[2].aLine-1], [this.boxes[3].aCol+2, this.boxes[3].aLine] ])) 
        {
            this.rotationState = 2;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol-1, this.boxes[1].aLine+1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol+1, this.boxes[2].aLine-1 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol+2, this.boxes[3].aLine ) );
            this.clearOlds(aOlds);
            this.calcCorners();
        }
    } else  if(this.rotationState == 2) {
        if(!this.checkRotationPoints([ [this.boxes[1].aCol+1, this.boxes[1].aLine+1], [this.boxes[2].aCol-1, this.boxes[2].aLine-1], [this.boxes[3].aCol, this.boxes[3].aLine-2] ])) 
        {
            this.rotationState = 3;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol+1, this.boxes[1].aLine+1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol-1, this.boxes[2].aLine-1 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol, this.boxes[3].aLine-2 ) );
            this.clearOlds(aOlds);
            this.calcCorners();
        }
    } else  if(this.rotationState == 3) {
        if(!this.checkRotationPoints([ [this.boxes[1].aCol+1, this.boxes[1].aLine-1], [this.boxes[2].aCol-1, this.boxes[2].aLine+1], [this.boxes[3].aCol-2, this.boxes[3].aLine] ])) 
        {
            this.rotationState = 4;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol+1, this.boxes[1].aLine-1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol-1, this.boxes[2].aLine+1 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol-2, this.boxes[3].aLine ) );
            this.clearOlds(aOlds);
            this.calcCorners();
        }

    } else if(this.rotationState == 4) {
        if(!this.checkRotationPoints([ [this.boxes[1].aCol-1, this.boxes[1].aLine-1], [this.boxes[2].aCol+1, this.boxes[2].aLine+1], [this.boxes[3].aCol, this.boxes[3].aLine+2] ])) 
        {
            this.rotationState = 1;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol-1, this.boxes[1].aLine-1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol+1, this.boxes[2].aLine+1 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol, this.boxes[3].aLine+2 ) );
            this.clearOlds(aOlds);
            this.calcCorners();
        }
    }
    return this;
};


GAME.TileO = function(x,y,z) { 
    this.init(x,y,z);
    this.elephant = false;

};

GAME.TileO.prototype = Object.create( GAME.Tile.prototype );
GAME.TileO.prototype.constructor = GAME.TileO;
GAME.TileO.prototype.create = function(elephant) {

    if(elephant) this.elephant = true;

    if(this.elephant) {
        this.boxes.push( new GAME.Box(this.pos.x,this.pos.y,this.pos.z+1).create(1,this.tileID,this,'ele1') );
        this.boxes.push( new GAME.Box(this.pos.x+1,this.pos.y,this.pos.z+1).create(2,this.tileID,this,'ele2') );
        this.boxes.push( new GAME.Box(this.pos.x+1,this.pos.y,this.pos.z).create(3,this.tileID,this,'ele4') );
        this.boxes.push( new GAME.Box(this.pos.x,this.pos.y,this.pos.z).create(4,this.tileID,this,'ele3') );
    } else {
        this.boxes.push( new GAME.Box(this.pos.x,this.pos.y,this.pos.z).create(1,this.tileID,this,'box2') );
        this.boxes.push( new GAME.Box(this.pos.x+1,this.pos.y,this.pos.z).create(2,this.tileID,this,'box2') );
        this.boxes.push( new GAME.Box(this.pos.x,this.pos.y,this.pos.z+1).create(3,this.tileID,this,'box2') );
        this.boxes.push( new GAME.Box(this.pos.x+1,this.pos.y,this.pos.z+1).create(4,this.tileID,this,'box2') );        
    }

    this.calcCorners();
    return this;
};
GAME.TileO.prototype.rotate = function() {

        c0 = this.boxes[0].aCol;
        l0 = this.boxes[0].aLine;

        this.boxes[0].setPos( this.boxes[1].aCol, this.boxes[1].aLine ) ;
        this.boxes[1].setPos( this.boxes[2].aCol, this.boxes[2].aLine ) ;
        this.boxes[2].setPos( this.boxes[3].aCol, this.boxes[3].aLine ) ;
        this.boxes[3].setPos( c0, l0 ) ;

        this.boxes[0].rotate();
        this.boxes[1].rotate();
        this.boxes[2].rotate();
        this.boxes[3].rotate();

    return this;
};




GAME.TileZL = function(x,y,z) { 
    this.init(x,y,z);

};

GAME.TileZL.prototype = Object.create( GAME.Tile.prototype );
GAME.TileZL.prototype.constructor = GAME.TileZL;
GAME.TileZL.prototype.create = function() {

    this.boxes.push( new GAME.Box(this.pos.x,this.pos.y,this.pos.z+1).create(1,this.tileID,this,'box3') );
    this.boxes.push( new GAME.Box(this.pos.x,this.pos.y,this.pos.z).create(2,this.tileID,this,'box3') );
    this.boxes.push( new GAME.Box(this.pos.x+1,this.pos.y,this.pos.z+1).create(3,this.tileID,this,'box3') );
    this.boxes.push( new GAME.Box(this.pos.x+1,this.pos.y,this.pos.z+2).create(4,this.tileID,this,'box3') );
    this.calcCorners();
    return this;
};
GAME.TileZL.prototype.rotate = function() {

    var c = this.boxes[0].aCol;
    var l = this.boxes[0].aLine;
    var aOlds = [];
    

    if(this.rotationState == 1) {
        if(!this.checkRotationPoints([ [this.boxes[1].aCol-1, this.boxes[1].aLine+1], [this.boxes[2].aCol-1, this.boxes[2].aLine-1], [this.boxes[3].aCol, this.boxes[3].aLine-2] ])) 
        {
            this.rotationState = 2;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol-1, this.boxes[1].aLine+1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol-1, this.boxes[2].aLine-1 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol, this.boxes[3].aLine-2 ) );
            this.clearOlds(aOlds);
            this.calcCorners();
        }
    } else  if(this.rotationState == 2) {
        if(!this.checkRotationPoints([ [this.boxes[1].aCol+1, this.boxes[1].aLine+1], [this.boxes[2].aCol-1, this.boxes[2].aLine+1], [this.boxes[3].aCol-2, this.boxes[3].aLine] ])) 
        {
            this.rotationState = 3;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol+1, this.boxes[1].aLine+1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol-1, this.boxes[2].aLine+1 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol-2, this.boxes[3].aLine ) );
            this.clearOlds(aOlds);
            this.calcCorners();
        }
    } else  if(this.rotationState == 3) {
        if(!this.checkRotationPoints([ [this.boxes[1].aCol+1, this.boxes[1].aLine-1], [this.boxes[2].aCol+1, this.boxes[2].aLine+1], [this.boxes[3].aCol, this.boxes[3].aLine+2] ])) 
        {
            this.rotationState = 4;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol+1, this.boxes[1].aLine-1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol+1, this.boxes[2].aLine+1 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol, this.boxes[3].aLine+2 ) );
            this.clearOlds(aOlds);
            this.calcCorners();
        }

    } else if(this.rotationState == 4) {
        if(!this.checkRotationPoints([ [this.boxes[1].aCol-1, this.boxes[1].aLine-1], [this.boxes[2].aCol+1, this.boxes[2].aLine-1], [this.boxes[3].aCol+2, this.boxes[3].aLine] ])) 
        {
            this.rotationState = 1;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol-1, this.boxes[1].aLine-1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol+1, this.boxes[2].aLine-1 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol+2, this.boxes[3].aLine ) );
            this.clearOlds(aOlds);
            this.calcCorners();
        }
    }
    return this;
};



GAME.TileZR = function(x,y,z) { 
    this.init(x,y,z);

};

GAME.TileZR.prototype = Object.create( GAME.Tile.prototype );
GAME.TileZR.prototype.constructor = GAME.TileZR;
GAME.TileZR.prototype.create = function() {

    this.boxes.push( new GAME.Box(this.pos.x,this.pos.y,this.pos.z+1).create(1,this.tileID,this,'box3') );
    this.boxes.push( new GAME.Box(this.pos.x,this.pos.y,this.pos.z).create(2,this.tileID,this,'box3') );
    this.boxes.push( new GAME.Box(this.pos.x-1,this.pos.y,this.pos.z+1).create(3,this.tileID,this,'box3') );
    this.boxes.push( new GAME.Box(this.pos.x-1,this.pos.y,this.pos.z+2).create(4,this.tileID,this,'box3') );
    this.calcCorners();
    return this;
};

GAME.TileZR.prototype.rotate = function() {

    var c = this.boxes[0].aCol;
    var l = this.boxes[0].aLine;
    var aOlds = [];
    

    if(this.rotationState == 1) {
        if(!this.checkRotationPoints([ [this.boxes[1].aCol-1, this.boxes[1].aLine+1], [this.boxes[2].aCol+1, this.boxes[2].aLine+1], [this.boxes[3].aCol+2, this.boxes[3].aLine] ])) 
        {
            this.rotationState = 2;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol-1, this.boxes[1].aLine+1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol+1, this.boxes[2].aLine+1 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol+2, this.boxes[3].aLine ) );
            this.clearOlds(aOlds);
            this.calcCorners();
        }
    } else  if(this.rotationState == 2) {
        if(!this.checkRotationPoints([ [this.boxes[1].aCol+1, this.boxes[1].aLine+1], [this.boxes[2].aCol+1, this.boxes[2].aLine-1], [this.boxes[3].aCol, this.boxes[3].aLine-2] ])) 
        {
            this.rotationState = 3;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol+1, this.boxes[1].aLine+1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol+1, this.boxes[2].aLine-1 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol, this.boxes[3].aLine-2 ) );
            this.clearOlds(aOlds);
            this.calcCorners();
        }
    } else  if(this.rotationState == 3) {
        if(!this.checkRotationPoints([ [this.boxes[1].aCol+1, this.boxes[1].aLine-1], [this.boxes[2].aCol-1, this.boxes[2].aLine-1], [this.boxes[3].aCol-2, this.boxes[3].aLine] ])) 
        {
            this.rotationState = 4;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol+1, this.boxes[1].aLine-1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol-1, this.boxes[2].aLine-1 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol-2, this.boxes[3].aLine ) );
            this.clearOlds(aOlds);
            this.calcCorners();
        }

    } else if(this.rotationState == 4) {
        if(!this.checkRotationPoints([ [this.boxes[1].aCol-1, this.boxes[1].aLine-1], [this.boxes[2].aCol-1, this.boxes[2].aLine+1], [this.boxes[3].aCol, this.boxes[3].aLine+2] ])) 
        {
            this.rotationState = 1;
            aOlds.push( this.boxes[1].setPos( this.boxes[1].aCol-1, this.boxes[1].aLine-1 ) );
            aOlds.push( this.boxes[2].setPos( this.boxes[2].aCol-1, this.boxes[2].aLine+1 ) );
            aOlds.push( this.boxes[3].setPos( this.boxes[3].aCol, this.boxes[3].aLine+2 ) );
            this.clearOlds(aOlds);
            this.calcCorners();
        }
    }
    return this;
};