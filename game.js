import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.117.1/build/three.module.js'

var camera, scene, renderer;
var geometry, material, mesh;
var geometrySphere, materialSphereGreen, materialSphereRed
var meshSphereGreen, meshSphereRed;

var group = new THREE.Group();
group.castShadow = true;
group.receiveShadow = true
var groupBalls = new THREE.Group()
const width = window.innerWidth
const height = window.innerHeight
var directionalLight, ambientLight
var trapezoid
var stop = false

init();
animate();

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}

function init(){

    scene = new THREE.Scene();

    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera(
        width / - 2, width / 2, height / 2, height / - 2, 1, 1000
    );    
    camera.position.set(0,10)

    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
    renderer.setSize( window.innerWidth, window.innerHeight ); 
    renderer.shadowMap.enabled = true
    document.body.appendChild( renderer.domElement );

    directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.x += 100
    directionalLight.position.y += 50 // +=10
    directionalLight.position.z += 70
    directionalLight.castShadow = true
    const d = 100;
    directionalLight.shadow.camera.left = - d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d + 100;
    directionalLight.shadow.camera.bottom = - 300;
    scene.add(directionalLight);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // const helper = new THREE.CameraHelper(directionalLight.shadow.camera)
    // scene.add(helper)

    geometry = new THREE.CylinderGeometry( 70, 70, 25, 3 );
    geometry.center()
    material = new THREE.MeshPhongMaterial( {color: 0xffffff} );
    mesh = new THREE.Mesh( geometry, material );

    mesh.position.set(1, 1, 0);
    mesh.translateY(-180)
    mesh.rotation.x = 20
    mesh.rotation.y = 45

    mesh.castShadow = true; 
    mesh.receiveShadow = true;
    scene.add( mesh );

    var tPoints = [
        new THREE.Vector2(-100,0), 
        new THREE.Vector2(600, 0),
        new THREE.Vector2(300,600),
        new THREE.Vector2(200,600),
    ];
      
    var tGeom = new THREE.ExtrudeGeometry(new THREE.Shape(tPoints), {
    depth: 1,
    bevelEnabled: false
    });
    tGeom.center();

    var tMat = new THREE.ShaderMaterial({
    uniforms: {
        color1: {
        value: new THREE.Color("#00a9d2")
        },
        color2: {
        value: new THREE.Color("#91b4e9")
        },
        bboxMin: {
        value: tGeom.boundingBox.min
        },
        bboxMax: {
        value: tGeom.boundingBox.max
        }
    },
    vertexShader: `
        uniform vec3 bboxMin;
        uniform vec3 bboxMax;
    
        varying vec2 vUv;
    
        void main() {
        vUv.y = (position.y - bboxMin.y) / (bboxMax.y - bboxMin.y);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
    
        varying vec2 vUv;
        
        void main() {
        
        gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0);
        }
    `,
    wireframe: false
    });

    trapezoid = new THREE.Mesh(tGeom, tMat);
    trapezoid.position.set(0, 0, 0);
    trapezoid.translateY(-130)
    scene.add(trapezoid);
    trapezoid.material.depthWrite = false
    trapezoid.renderOrder = -99999

    const geometryPlane = new THREE.PlaneGeometry( 500, 500, 32 );
    const materialPlane = new THREE.ShadowMaterial({transparent:true});
    materialPlane.opacity = 0.2;

    const plane = new THREE.Mesh( geometryPlane, materialPlane );
    plane.receiveShadow = true;
    plane.castShadow = true;  
    scene.add( plane );


    geometrySphere = new THREE.SphereGeometry( 10, 50, 15 );
    materialSphereGreen = new THREE.MeshPhongMaterial( {color: 0x00ff00 } );
    materialSphereRed = new THREE.MeshPhongMaterial( {color: 0xff0000 } );
    
    meshSphereGreen = new THREE.Mesh( geometrySphere, materialSphereGreen );
    meshSphereRed = new THREE.Mesh( geometrySphere, materialSphereRed );

    meshSphereGreen.castShadow = true; 
    meshSphereGreen.receiveShadow = true;      
    meshSphereRed.castShadow = true; 
    meshSphereRed.receiveShadow = true;

    var box = new THREE.Box3().setFromObject( mesh );
    var object3DWidth  = box.max.x - box.min.x;
    var object3DHeight = box.max.y - box.min.y;
    var object3DDepth  = box.max.z - box.min.z;

    // position camera to fill view according to bounding box size

    var size=Math.max(object3DHeight,object3DWidth,object3DDepth);
    var dist= size / 2 / Math.tan(Math.PI * 60 / 360); 

    camera.position.z = dist ; 
    }

var domEvents = renderer.domElement;
domEvents.addEventListener('touchmove', getTouchDirection, { passive: true });
domEvents.addEventListener('touchend',getTouchEnd, {passive: true})
domEvents.addEventListener('mousemove', getMouseDirection, false);
domEvents.addEventListener('click',moveBalls,false)
domEvents.addEventListener('click',newBall,false) 
domEvents.addEventListener('click',startTimeout,false) 

    
function newBall(){
    var num = 1;
    
    for (var i = 0 ; i < num ; i++) {
        var x = Math.random() * (100) + 100  
        var y = Math.random() * (30) + 130
        var z = Math.random() * (trapezoid.position.z) + 1
    
        var ranColor = Math.round(Math.random())
        if (ranColor){
            var cloneBall = meshSphereGreen.clone()
        } else {
            var cloneBall = meshSphereRed.clone()
        }
        cloneBall.position.set(x-150,y,z)
        groupBalls.add(cloneBall)
        scene.add(groupBalls);
    }
    setTimeout(newBall, 1000);
}

var oldX = 0;
function getMouseDirection(event) {
    
if (oldX < event.movementX) {
        if (mesh.position.x > (trapezoid.position.x + 150)){
            return
        } else {
        mesh.position.x += 2.9 
        mesh.rotation.y -=0.005
        }
    } else {
        if (mesh.position.x < (trapezoid.position.x - 130)){
            return
        } else {
        mesh.position.x -= 2.9 
        mesh.rotation.y +=0.005
        }    
    }
}

var previousTouch = 0 ;

function getTouchDirection(event) {
    const touch = event.touches[0];
if (previousTouch < touch.clientX) {
    if (mesh.position.x > (trapezoid.position.x + 150)){
        return
    } else {
    mesh.position.x += 2.9 
    mesh.rotation.y -=0.005
    }
} else {
    if (mesh.position.x < (trapezoid.position.x - 130)){
        return
    } else {
    mesh.position.x -= 2.9 
    mesh.rotation.y +=0.005
    }    
}
previousTouch = touch.clientX;
}

function getTouchEnd(){
    previousTouch = null;
}

var score, scoreNewValue; 
var xDiv, yDiv;
var xDif
var currentBall; 

function moveBalls(){

    if (stop){
        return;
    }

    requestAnimationFrame( moveBalls );
    for (var i = 0; i < groupBalls.children.length; i++) 
    {
        currentBall = groupBalls.children[i]
        xDiv = mesh.position.x / currentBall.position.x
        xDif = mesh.position.x - currentBall.position.x

        yDiv = mesh.position.y / currentBall.position.y
        if (currentBall.position.x > 2){
            currentBall.position.x += 0.09
            currentBall.position.y -=0.3
            scaleBalls(yDiv,currentBall)
        }
        else if (currentBall.position.x < -2){
            currentBall.position.x -= 0.09
            currentBall.position.y -=0.3
            scaleBalls(yDiv,currentBall)
        }
        else if( currentBall.position.x <2 && currentBall.position.x > -2){
            currentBall.position.y -=0.3
            scaleBalls(yDiv,currentBall)
        }
        if (currentBall.position.y < -90){
            var colorGreen = new THREE.Color( 0x00ff00 ) 
            var colorRed = new THREE.Color( 0xff0000 ) 
            if ((xDiv >= 0.19 && xDiv <= 1.7) || (xDif >=7 && xDif <=12)) {
                if (currentBall.material.color.equals( colorGreen )) {
                    updateField(1,0x00ff00)
                    particles(currentBall, colorGreen)
                }
                if (currentBall.material.color.equals( colorRed )) {
                    updateField(-1,0xff0000)
                    particles(currentBall, colorRed)
                }
            }
            currentBall.parent.remove(currentBall)
        }
    }
}

function scaleBalls(yDiv,currentBall){
    if (yDiv < 100){
        currentBall.scale.x += 0.0005;
        currentBall.scale.y += 0.0005;
        }
        else {
            currentBall.scale.x += 0.001;
            currentBall.scale.y += 0.001;
        }
}

function updateField(difScore, hexCode){
    score = parseInt(document.getElementById("numScore").innerHTML)
    scoreNewValue = score + difScore 
    document.getElementById("numScore").innerHTML = scoreNewValue
    mesh.material.color.setHex( hexCode );
}

var particleBalls = [] ; 
var smallBallGeometry,smallBallMaterial, smallBall

function particles(objName, color){
    var smallBallsLenght = 30; 
    for (var i=0; i < smallBallsLenght; i++){
        var u = Math.random();
        var v = Math.random();
        var theta = 2 * Math.PI * u;
        var phi = Math.acos(2 * v - 1);
        var x = objName.position.x + (30 * Math.sin(phi) * Math.cos(theta));
        var y = objName.position.y + 20 + (30 * Math.sin(phi) * Math.sin(theta));
        var z = objName.position.z + (30 * Math.cos(phi));

        smallBallGeometry = new THREE.SphereGeometry( 1, 50, 15 )
        smallBallMaterial = new THREE.MeshPhongMaterial( {color: color, transparent: true, opacity: 1} )
        smallBall = new THREE.Mesh(smallBallGeometry ,smallBallMaterial )
        smallBall.scale.set(((Math.random() * 1.5) ),((Math.random() * 1.5) ),((Math.random() * 1.5) ))
        smallBall.position.set(x,y,z)
        scene.add(smallBall)
        particleBalls.push(smallBall)
        particlesMovement()
    }
}

function particlesMovement(){ 
    requestAnimationFrame( particlesMovement );
    for (var i=0; i < particleBalls.length; i++){
        if (particleBalls[i].position.y >= -150 ){
            if (particleBalls[i].material.opacity > 0 ){
            particleBalls[i].material.opacity -= 0.0001; 
            }
        } else {
            particleBalls[i].parent.remove(particleBalls[i])
            particleBalls.splice(i,1)
        }
    }
}

var timeleft = 1;
function startTimeout(){
var timing = setInterval(function(){
  if(timeleft >= 11){
    alertFunc()
    clearInterval(timing);
    document.getElementById("countdown").innerHTML = "";
  }
  else {
    let time = 10 - timeleft
    document.getElementById("countdown").innerHTML = "00:0" + time + "s";
    timeleft += 1; }
}, 1000);
}

var playNow; 
function alertFunc() {
    playNow = document.getElementById("playNow")
    playNow.style.display = "block";
    playNow.onclick = function () {
    location.href = "./gameStoreLink.html";
    };
    stop=true
}

const resize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    "use strict";
    window.location.reload();
    renderer.setSize( window.innerWidth, window.innerHeight )
  }
  window.addEventListener('resize', resize)