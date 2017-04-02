"use strict";

var canvas;
var gl;
var program;
var context;

var NumVertices = 36;

// Length of side of one of the cubelets
var sidelen = 0.5;

// Spacing between cubelets
var spacing = 1.1;

var points = [];
var colors = [];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;
var theta = [ 0, 0, 0 ];

var modelViewMatrix;
var projectionMatrix;

var modelViewMatrixLoc;
var projectionMatrixLoc;
var thetaLoc;

var eye = vec3(0.0, 0.0, 4.0); // Place camera
var at = vec3(0.0, 0.0, 0.0); // Point camera towards origin
var up = vec3(0.0, 1.0, 0.0); // Upwards is always the positive Y-Axis

var fovy = 45.0;  // Angle (in degrees) of the field-of-view in the Y-direction
var aspect = 1.0; // Aspect ratio of the viewport
var near = 0.3;
var far = 1000;

var cameraRadius = 20.0;
var THETA = radians(45);
var PHI = radians(45);

eye = vec3(cameraRadius*Math.sin(PHI)*Math.sin(THETA),
            cameraRadius*Math.cos(PHI),
            cameraRadius*Math.sin(PHI)*Math.cos(THETA));

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    context = canvas.getContext("2d");
    if ( !gl ) { alert( "WebGL isn't available" ); }

    rubixCube();
    //cubelet();
    console.log(points)
    console.log(colors)

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
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

    render();

}

function rubixCube()
{
    for ( var i = 0; i < 27; i++) {
        cubelet();
    }
}

function cubelet()
{
    quad( 1, 0, 3, 2, sidelen );
    quad( 2, 3, 7, 6, sidelen );
    quad( 3, 0, 4, 7, sidelen );
    quad( 6, 5, 1, 2, sidelen );
    quad( 4, 5, 6, 7, sidelen );
    quad( 5, 4, 0, 1, sidelen );
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

    /*var vertexColors = [
        [255,235,  0,250],// right: yellow [r,g,b,a]
        [  0, 50,115,250],// up   : blue
        [164,  0, 15,250],// front: red
        [248,248,248,250],// left : white
        [  0,135, 45,250],// down : green
        [255, 46,  0,250] // back : orange
        ];*/
    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];
    

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        //colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        colors.push( vertexColors[a] );
    }
}


function Cubie(i, j, k){
    const cubePadding = .1;
    this.location = vec4(i, j, k, 1.0);             //ith/jth/kth index cubie from furthest left/bottom/front on x/y/z axis (changes per rotation)
    const originalLocation = vec3(i, j, k, 1.0);    //original values for i, j, and k in solved rubik's cube
    this.theta = [0,0,0];                           //rotation of cubie about origin of rubik's cube. Used for rotating faces
    var previousRotationMatrix = mat4();

    function getRotationMatrix(theta){
        return mult(rotateZ(theta[zAxis]), mult(rotateY(theta[yAxis]), rotateX(theta[xAxis])))
    }

    this.getModelMatrix = function(){
        var translationMatrix = translate(i + Math.sign(i) * cubePadding, j + Math.sign(j) * cubePadding, k + Math.sign(k) * cubePadding);        
        var rotationMatrix = mult(getRotationMatrix(this.theta), previousRotationMatrix);
        var overallModelMatrix = mult(rotationMatrix, translationMatrix);
        return overallModelMatrix;
    }

    //post rotation update location for future rotations, and store all previous rotation matrices' results
    this.updateLocation = function(){
        var rotationMatrix = getRotationMatrix(this.theta);

        previousRotationMatrix = mult(rotationMatrix, previousRotationMatrix);
        this.location = mult(rotationMatrix,this.location);

        for(var i = 0; i < this.location.length; i++){
            this.location[i] = Math.round(this.location[i]);
        }
        this.theta = [0,0,0];
    }
}

function RubiksCube(){
    this.cubies = [];

    this.initCubies = function(){
        for(var i = -1; i <= 1; i++){
            for(var j = -1; j <= 1; j++){
                for(var k = -1; k <= 1; k++){
                    var newCubie = new Cubie(i, j, k);
                    this.cubies.push(newCubie);
                }
            }
        }
    }
}

var rCube = new RubiksCube();

function Rotation(){
    var axis;               //axis which the current rotation is about (0, 1, or 2)/(xaxis,yaxis, or zaxis)
    var sign = 1;           //1 for positive, -1 for negative, determines whether it goes clockwise/counterclockwise
    var plane;              //which plane to rotate
    var anglesRotated = 90; //how much of the rotation is complete. It is complete at >= 90, starts at 0
    var speed = 10;         //how many angles to rotate per iteration

    var rotationQueue = [];
    var completedRotations = [];

    function isRotating(){
        return (anglesRotated - speed < 90);
    }

    function cleanUpCubies(){
        rCube.cubies.forEach(function(cubie){
            if(cubie.location[axis] == plane){
                cubie.updateLocation();
            }
        });
    }

    this.setspeed = function(newSpeed){
        speed = newSpeed;
    }

    this.randomRotation = function(){
        var axis = getRandomInt(xAxis,zAxis);
        var sign = getRandomInt(0,1);
        if(sign === 0){sign = -1;}
        var plane = getRandomInt(-1,1)
        this.queueRotation(axis, sign, plane);
    }

    this.randomRotations = function(n){
        if(rotationQueue.length + n > 9000){
            alert("Wow! There would be over 9000 rotations! We couldn't possibly make you wait for so long :o. Please try again or with a smaller amount of rotations"); return;
        }
        if(!(parseInt(n) > 0)){
            alert("Please select a positive nonzero integer! Thanks!"); return;
        }
        for(var i = 0; i < n; i++){
            this.randomRotation();
        }
    }

    this.queueRotation = function(ax,s,p){
        if(ax !== xAxis && ax !== yAxis && ax !== zAxis){
            alert("ERROR: Invalid Axis! Must be 0, 1, or 2");
        }
        if(s !== 1 && s !== -1){
            alert("ERROR: invalid rotation sign! Must be +1 or -1");
        }
        if(p !== -1 && p !== 0 && p !== 1){
            alert("ERROR: invalid rotation location! Must be -1, 0, or 1");
        }
        if(rotationQueue.length > 9000){
            alert("Wow! There's over 9000 rotations waiting in the queue. Please wait before submitting more rotations. Thanks!"); return;
        }
        var rotation = [ax,s,p];
        rotationQueue.push(rotation);

        this.beginNextRotation();
    }

    this.beginNextRotation = function(){
        if(rotationQueue.length === 0){return;} //no rotations available
        if(isRotating()){return;}//don't begin next rotation until current one completes

        anglesRotated = 0;
        var nextRotation = rotationQueue.shift();

        axis = nextRotation[0];
        sign = nextRotation[1];
        plane = nextRotation[2];
        console.log(rotationQueue.length + " rotations remaining. Began: " + nextRotation);
    }

    this.try = function(){
        anglesRotated += speed;
        if(isRotating()){
            rCube.cubies.forEach(function(cubie){
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
            cleanUpCubies();
            this.beginNextRotation();
        }
    }
}

var rotation = new Rotation();

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //theta[axis] += 2.0;
    gl.uniform3fv(thetaLoc, theta);

    //gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    // Set the camera position
    eye = vec3(cameraRadius*Math.sin(PHI)*Math.sin(THETA),
                cameraRadius*Math.cos(PHI),
                cameraRadius*Math.sin(PHI)*Math.cos(THETA));
    
    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(fovy, aspect, near, far);

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

    rCube.cubies.forEach(function(cubie){
        modelViewMatrix = mult(viewMatrix, cubie.getModelMatrix());
        gl.uniformMatrix4fv(_modelViewMatrix, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLES, 0, NumVertices);  
    });


    requestAnimFrame( render );
}  