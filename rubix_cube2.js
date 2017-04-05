"use strict";

var canvas;
var gl;
var program;
var context;

var NumVertices = 36;

const orthoTop = 3;


var sidelen = 0.5;


var spacing = 1.15;

var points = [];


var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis;
var theta = [ 0, 0, 0 ]; //Origin

var _worldViewMatrix;
var _modelViewMatrix;
var _projectionMatrix;

//var modelViewMatrixLoc;
//var projectionMatrixLoc;
var thetaLoc;

var eye = vec3(0.0, 0.0, 4.0); // Places the camera
var at = vec3(0.0, 0.0, 0.0); // Points the camera towards origin
var up = vec3(0.0, 1.0, 0.0); // Sets up as the positive y axis

var fovy = 45.0; 
var aspect = 1.0; 
var near = 0.3;
var far = 1000;

var cameraRadius = 20.0;
var THETA = radians(45);
var PHI = radians(45);

var speed = 5;
var axis;               
var sign = 1;           
var plane;              
var anglesRotated = 90;      

var rotationQueue = [];
var completedRotates = [];

var FileToLoad = false;
var contents; 
var textFile = null;

var overallModelMatrix;
//var rotationMatrix;
var GlobalMatrix = [];

eye = vec3(cameraRadius*Math.sin(PHI)*Math.sin(THETA),
            cameraRadius*Math.cos(PHI),
            cameraRadius*Math.sin(PHI)*Math.cos(THETA));

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    context = canvas.getContext("2d");
    if ( !gl ) { alert( "WebGL isn't available" ); }

    cubelet();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    /*
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor ); */

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    _projectionMatrix = gl.getUniformLocation(program, "projectionMatrix");
    _modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");
    _worldViewMatrix = gl.getUniformLocation(program, "worldViewMatrix");

    thetaLoc = gl.getUniformLocation(program, "theta");

    /*================= Mouse events ======================*/

         var AMORTIZATION = 0.95;
         var drag = false;
         var old_x, old_y;
         var dX = 0, dY = 0;
         
         var mouseDown = function(e) {
            drag = true;
            old_x = e.pageX, old_y = e.pageY;
            e.preventDefault();
            return false;
         };
         
         var mouseUp = function(e){
            drag = false;
         };
         
         var mouseMove = function(e) {
            if (!drag) return false;
            dX = (e.pageX-old_x)*2*Math.PI/canvas.width,
            dY = (e.pageY-old_y)*2*Math.PI/canvas.height;
            THETA+= dX;
            PHI+=dY;
            old_x = e.pageX, old_y = e.pageY;
            e.preventDefault();
         };
         
         canvas.addEventListener("mousedown", mouseDown, false);
         canvas.addEventListener("mouseup", mouseUp, false);
         canvas.addEventListener("mouseout", mouseUp, false);
         canvas.addEventListener("mousemove", mouseMove, false);
         //console.log(drag);

         /*=========================rotation================*/

         function rotateX(m, angle) {
            var c = Math.cos(angle);
            var s = Math.sin(angle);
            var mv1 = m[1], mv5 = m[5], mv9 = m[9];
            
            m[1] = m[1]*c-m[2]*s;
            m[5] = m[5]*c-m[6]*s;
            m[9] = m[9]*c-m[10]*s;

            m[2] = m[2]*c+mv1*s;
            m[6] = m[6]*c+mv5*s;
            m[10] = m[10]*c+mv9*s;
         }

         function rotateY(m, angle) {
            var c = Math.cos(angle);
            var s = Math.sin(angle);
            var mv0 = m[0], mv4 = m[4], mv8 = m[8];
            
            m[0] = c*m[0]+s*m[2];
            m[4] = c*m[4]+s*m[6];
            m[8] = c*m[8]+s*m[10];

            m[2] = c*m[2]-s*mv0;
            m[6] = c*m[6]-s*mv4;
            m[10] = c*m[10]-s*mv8;
         }

         /*=========================scaling================*/
        var scale = 1;
        var originx = 0;
        var originy = 0;




    //event listeners for buttons
/*
    document.getElementById( "xButton" ).onclick = function () {
        axis = xAxis;
    };
    document.getElementById( "yButton" ).onclick = function () {
        axis = yAxis;
    };
    document.getElementById( "zButton" ).onclick = function () {
        axis = zAxis;
    };
    */

    function handleFileSelect(evt) {
    var files = evt.target.files; 
        console.log(files);
      var reader = new FileReader();
      f = files[0];
      // Closure to capture the file information.
      reader.onload = (function(theFile) {
        FileToLoad = true;
        return function(e) {
          contents = JSON.parse(reader.result);
          var x, y, z;
          for (x = 0; x < 3; x++) {
            for (y = 0; y < 3; y++) {
              for (z = 0; z < 3; z++) {
                contents[x][y][z][4].matrix = true;
              }
            }
          }
        }
      })(f);
      reader.readAsText(f);
    }

/*
document.getElementById("SaveButton").onclick = function (e) {
        var link = document.getElementById("downloadlink");
        link.href = makeTextFile(JSON.stringify([overallModelMatrix]));
        function makeTextFile(text) {
            var data = new Blob([text], {type: 'text/plain'});
            if (textFile !== null) {
              window.URL.revokeObjectURL(textFile);
            }
            textFile = window.URL.createObjectURL(data);
            return textFile;
        }
    };
*/


document.getElementById( "SaveButton" ).onclick = function(text, filename, type) {
    var link = document.getElementById("downloadlink"),
        data = new Blob([text], {type: 'text/plain'});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var url = URL.createObjectURL(data);
        link.href = makeTextFile(JSON.stringify([GlobalMatrix]));
        function makeTextFile(text) {
            var data = new Blob([text], {type: 'text/plain'});
            if (textFile !== null) {
              window.URL.revokeObjectURL(textFile);
            }
            textFile = window.URL.createObjectURL(data);
            return textFile;
        }
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(function() {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}


    //cubie.getModelMatrix()
    //document.getElementById("files").addEventListener("change", handleFileSelect, false);
    document.getElementById( "LoadButton" ).onclick = function () {
        if (!FileToLoad) {
          alert("Error: Please specify a Rubik's cube state file");
        } else {
          //cubePosition = contents.slice();
        }
    };
    
    eventSetup();

    RubiksCube.initCubies();

    render();

}
/*
function rubixCube()
{
    for ( var i = 0; i < 27; i++) {
        cubelet();
    }
}
*/

function cubelet()
{
    quad(2, 3, 7, 6,sidelen); // right face
    quad(5, 4, 0, 1,sidelen); // left face
    quad(6, 5, 1, 2,sidelen); // top face
    quad(3, 0, 4, 7,sidelen); // bottom face
    quad(1, 0, 3, 2,sidelen); // front face
    quad(4, 5, 6, 7,sidelen); // back face
}

function quad(a, b, c, d, s)
{
    var vertices = [
        vec4( -s, -s,  s, 1.0 ),
        vec4( -s,  s,  s, 1.0 ),
        vec4(  s,  s,  s, 1.0 ),
        vec4(  s, -s,  s, 1.0 ),
        vec4( -s, -s, -s, 1.0 ),
        vec4( -s,  s, -s, 1.0 ),
        vec4(  s,  s, -s, 1.0 ),
        vec4(  s, -s, -s, 1.0 )
    ];



    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
    }
}


function Cubie(i, j, k){            
    this.previousRotateMatrix = mat4();
    const originalLocation = vec3(i, j, k, 1.0);   
    this.location = vec4(i, j, k, 1.0);  
    this.theta = [0,0,0];                           
    this.cubieColors = generateColors();

    function getRotateMatrix(theta){
        return mult(rotateZ(theta[zAxis]), mult(rotateY(theta[yAxis]), rotateX(theta[xAxis])))
    }

    this.getModelMatrix = function(){
        var translationMatrix = translate(i * spacing, j * spacing, k * spacing);        
        var rotationMatrix = mult(getRotateMatrix(this.theta), this.previousRotateMatrix);
        overallModelMatrix = mult(rotationMatrix, translationMatrix);
        GlobalMatrix.push(rotationMatrix);
        return overallModelMatrix;
    }
    //console.log(rotationMatrix);
    //console.log(GlobalMatrix);
    function getRoundedMatrix(m){
        var newM = mat4();
        for(var i = 0; i < m.length; i++){
            for(var j = 0; j < m[0].length; j++){
                newM[i][j] = Math.round(m[i][j]);
            }
        }
        return newM;
    }

    this.updateLocation = function(){
        var rotationMatrix = getRotateMatrix(this.theta);
        this.previousRotateMatrix = getRoundedMatrix(mult(rotationMatrix, this.previousRotateMatrix));
        this.location = mult(rotationMatrix,this.location);

        for(var i = 0; i < this.location.length; i++){
            this.location[i] = Math.round(this.location[i]);
        }
        this.theta = [0,0,0];
    }

    function generateColors () {
        var colors = [];
        genColorsFace(2, 3, 7, 6); // right face
        genColorsFace(5, 4, 0, 1); // left face
        genColorsFace(6, 5, 1, 2); // top face
        genColorsFace(3, 0, 4, 7); // bottom face
        genColorsFace(1, 0, 3, 2); // front face
        genColorsFace(4, 5, 6, 7); // back face
        return colors;

        function genColorsFace(a, b, c, d) {

            var vertexColors = [
                vec4( 0.0, 0.0, 0.0, 1.0 ), // black (inside), index 0
                vec4( 0.0, 1.0, 0.0, 1.0 ), // green (front), index 1
                vec4( 1.0, 0.0, 0.0, 1.0 ), // red (right), index 2
                vec4( 1.0, 1.0, 0.0, 1.0 ), // yellow (bottom), index 3
                vec4( 0.0, 0.0, 1.0, 1.0 ), // blue (back), index 4
                vec4( 1.0, 0.5, 0.0, 1.0 ), // orange (left), index 5
                vec4( 1.0, 1.0, 1.0, 1.0 ) // white (top), index 6
            ];

            var rightRubix = (i == 1);
            var leftRubix = (i == -1);
            var topRubix = (j == 1);
            var bottomRubix = (j == -1);
            var frontRubix = (k == 1);
            var backRubix = (k == -1);

            var rightCubelet = (a == 2);
            var leftCubelet = (a == 5);
            var topCubelet = (a == 6);
            var bottomCubelet = (a == 3);
            var frontCubelet = (a == 1);
            var backCubelet = (a == 4);

            var right = rightRubix && rightCubelet;
            var left = leftRubix && leftCubelet;
            var top = topRubix && topCubelet;
            var bottom = bottomRubix && bottomCubelet;
            var front = frontRubix && frontCubelet;
            var back = backRubix && backCubelet;

            var indices = [ a, b, c, a, c, d ];
            for ( var ii = 0; ii < indices.length; ++ii ) {
                //colors.push( vertexColors[a] ); // Cool colors
                if (right || left || top || bottom || front || back) {
                    colors.push( vertexColors[a] );
                } else {
                    colors.push(vertexColors[0]);
                }  
            }
        }
    }
}

function Rubik(){
    this.cubies = [];

    this.initCubies = function(){
        for(var i = -1; i <= 1; i++){
            for(var j = -1; j <= 1; j++){
                for(var k = -1; k <= 1; k++){
                    var CubieInstance = new Cubie(i, j, k);
                    this.cubies.push(CubieInstance);
                }
            }
        }
    }
    this.checkSolved = function(){
        var otherMatrix = mat4();
        console.log(this.cubies[0].location);
        var rotationMatrix = this.cubies[0].previousRotateMatrix;
        for(var i = 1; i < this.cubies.length; i++){
            var isCenter = (this.cubies[i].location[0] == 0 && this.cubies[i].location[1] == 0 && this.cubies[i].location[2] === 0);
            if(!isCenter){
                otherMatrix = this.cubies[i].previousRotateMatrix;
                if(!equal(otherMatrix, rotationMatrix)){
                    return false;
                }
            }
        }
        return true;
    }
}

var RubiksCube = new Rubik();

function Rotate(){
    this.createspeed = function(newSpeed){
        speed = newSpeed;
    }
    function isRotating(){
        return (anglesRotated - speed < 90); //Full 90 degree turn
    }

    function UpdateLocation(){
        RubiksCube.cubies.forEach(function(cubie){
            if(cubie.location[axis] == plane){
                cubie.updateLocation();
            }
        });
    }

    function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    this.randomRotate = function(){
        var axis = getRandomInt(xAxis,zAxis);
        var sign = getRandomInt(0,1);
        if(sign === 0){
            sign = -1;
        }
        var plane = getRandomInt(-1,1)
        this.queueRotate(axis, sign, plane);
    }

    this.randomRotates = function(n){
        if(!(parseInt(n) > 0)){
            alert("Error:Positive numbers only!"); 
            return;
        }

        for(var i = 0; i < n; i++){
            this.randomRotate();
        }
    }

    this.queueRotate = function(ax,s,p){ //axis, sign/direction, plane/face
        if(ax !== xAxis && ax !== yAxis && ax !== zAxis){
            alert("ERROR: Invalid Axis! Must be 0, 1, or 2");
        }
        if(s !== 1 && s !== -1){
            alert("ERROR: invalid rotation sign! Must be +1 or -1");
        }
        if(p !== -1 && p !== 0 && p !== 1){
            alert("ERROR: invalid rotation location! Must be -1, 0, or 1");
        }
        var rotation = [ax,s,p];
        rotationQueue.push(rotation);

        this.ContinueRotation();
    }

    this.ContinueRotation = function(){
        if(rotationQueue.length === 0){
            return;
        } 
        if(isRotating()){
            return;
        }

        anglesRotated = 0;
        var nextRotate = rotationQueue.shift();

        axis = nextRotate[0];
        sign = nextRotate[1];
        plane = nextRotate[2];
    }

    this.try = function(){
        anglesRotated += speed;
        if(isRotating()){
            RubiksCube.cubies.forEach(function(cubie){
                if(cubie.location[axis] == plane){
                    cubie.theta[axis] = cubie.theta[axis] + speed * sign;
                    if(cubie.theta[axis] > 90){
                        cubie.theta[axis] = 90;
                    }
                    if(cubie.theta[axis] < -90){
                        cubie.theta[axis] = -90;
                    }
                }
            });
        }
        if(anglesRotated >= 90 && anglesRotated < 90 + speed * 2){
            UpdateLocation();
            this.ContinueRotation();
            if(RubiksCube.checkSolved()){
                //alert("Awesome job solving the Rubik's Cube!");
                document.getElementById("status").innerHTML = "Awesome job solving the Rubik's Cube!";
                document.getElementById("status").style.fontSize = "xx-large";
                document.getElementById("status").style.color = "red";
            }
            else{
                document.getElementById("status").innerHTML = "";
            }
        }
    }
}

var rotation = new Rotate();

function eventSetup(){
    document.getElementById("LButton").onclick = function () {
        rotation.queueRotate(xAxis, 1, -1);
    };
    document.getElementById("RButton").onclick = function () {
        rotation.queueRotate(xAxis, -1, 1);
    };
    document.getElementById("UButton").onclick = function () {
        rotation.queueRotate(yAxis, -1, 1);
    };
    document.getElementById("DButton").onclick = function () {
        rotation.queueRotate(yAxis, 1, -1);
    };
    document.getElementById("FButton").onclick = function () {
        rotation.queueRotate(zAxis, 1, -1);
    };
    document.getElementById("BButton").onclick = function () {
        rotation.queueRotate(zAxis, -1, 1);
    };
    document.getElementById("MVButton").onclick = function () {
        rotation.queueRotate(xAxis, 1, 0);
    };
    document.getElementById("MHButton").onclick = function () {
        rotation.queueRotate(yAxis, -1, 0);
    };
    document.getElementById("MSButton").onclick = function () {
        rotation.queueRotate(zAxis, 1, 0);
    };

    //Opposite Direction
    document.getElementById("LtButton").onclick = function () {
        rotation.queueRotate(xAxis, -1, -1);
    };
    document.getElementById("RtButton").onclick = function () {
        rotation.queueRotate(xAxis, 1, 1);
    };
    document.getElementById("UtButton").onclick = function () {
        rotation.queueRotate(yAxis, 1, 1);
    };
    document.getElementById("DtButton").onclick = function () {
        rotation.queueRotate(yAxis, -1, -1);
    };
    document.getElementById("FtButton").onclick = function () {
        rotation.queueRotate(zAxis, -1, -1);
    };
    document.getElementById("BtButton").onclick = function () {
        rotation.queueRotate(zAxis, 1, 1);
    };
    document.getElementById("MVtButton").onclick = function () {
        rotation.queueRotate(xAxis, -1, 0);
    };
    document.getElementById("MHtButton").onclick = function () {
        rotation.queueRotate(yAxis, 1, 0);
    };
    document.getElementById("MStButton").onclick = function () {
        rotation.queueRotate(zAxis, -1, 0);
    };

    var speedSlider = document.getElementById("speedSlider").onchange = function(event) {
        rotation.createspeed(parseInt(event.target.value));
    };

    document.getElementById("randomize").onclick = function () {
        var randomMoveAmount = document.getElementById("randomizeAmount").value;
        console.log(randomMoveAmount);
        rotation.randomRotates(parseInt(randomMoveAmount));
    };


}



function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    rotation.try();
    //cubelet();
    //theta[axis] += 2.0;
    var modelViewMatrix, projectionMatrix, worldViewMatrix;

    //gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
    //var viewMatrix = ViewMatri();
    // Set the camera position
    eye = vec3(cameraRadius*Math.sin(PHI)*Math.sin(THETA),
                cameraRadius*Math.cos(PHI),
                cameraRadius*Math.sin(PHI)*Math.cos(THETA));

    projectionMatrix = perspective(fovy, aspect, near, far);
    modelViewMatrix = lookAt(eye, at, up);
    worldViewMatrix = mat4();

    //projectionMatrix = ortho(-orthoTop, orthoTop, -orthoTop, orthoTop, near, far);
    gl.uniformMatrix4fv(_projectionMatrix, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(_modelViewMatrix, false, flatten(modelViewMatrix));

    //projectionMatrix = perspective(fovy, aspect, near, far);

    /*
    var x, y, z;
    for (x = -1; x <= 1; x++) {
        for (y = -1; y <= 1; y++) {
            for (z = -1; z <= 1; z++) {
                if (x !=0 || y !=0 || z!=0) {

                    var modelViewMatrixTmp = modelViewMatrix;

                    modelViewMatrix = mult(modelViewMatrixTmp, translate(vec3(x*spacing,y*spacing,z*spacing)));

                    var cBuffer = gl.createBuffer();
                    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
                    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

                    var vColor = gl.getAttribLocation( program, "vColor" );
                    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0 , 0);
                    gl.enableVertexAttribArray(vColor);

                    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
                    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
                    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

                    modelViewMatrix = modelViewMatrixTmp;


                }
            }  
        }
    }
    */
    
    RubiksCube.cubies.forEach(function(cubie){
        worldViewMatrix = mult(cubie.getModelMatrix(),worldViewMatrix);
        gl.uniformMatrix4fv(_worldViewMatrix, false, flatten(worldViewMatrix));

        var cBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(cubie.cubieColors), gl.STATIC_DRAW );

        var vColor = gl.getAttribLocation( program, "vColor" );
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );

        gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
        worldViewMatrix = mat4();  
    });


    requestAnimFrame(render);
}  




