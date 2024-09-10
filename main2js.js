import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
let renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
let renderWidth = window.innerWidth;
let renderHeight = window.innerHeight;
renderer.setSize(renderWidth, renderHeight);
document.getElementById('container').appendChild(renderer.domElement);
renderer.setClearColor(0x2d2d30, 0);
renderer.shadowMap.enabled = true;
let loader = new GLTFLoader();
let light = new THREE.PointLight(0xffffff, 1);
light.position.set(1, 1, 1);
light.castShadow = true; // Включите проекцию теней для света
scene.add(light);
let material = new THREE.MeshBasicMaterial({ color: 0x8690e4 }); // Задайте цвет в формате hex
let model;
loader.load(
	'model/box1.glb',
	function (gltf) {
		gltf.scene.traverse(function (node) {
			if (node.isMesh) {
				node.material = material;
				node.castShadow = true;
				node.receiveShadow = true;
			}
		});

		model = gltf.scene;
		model.position.set(-7, 2.9, -6);
		model.rotation.x = 0.7;
		scene.add(model);

		const fontLoader = new FontLoader();
		fontLoader.load(
			'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
			function (font) {
				const textGeometry = new TextGeometry('12', {
					font: font,
					size: 1, // уменьшенный размер
					height: 0.2,
					curveSegments: 12,
					bevelEnabled: true,
					bevelThickness: 0.03,
					bevelSize: 0.02,
					bevelOffset: 0,
					bevelSegments: 5,
				});

				let emissiveColor = new THREE.Color(0xfffff); // Голубой цвет
				let intensity = 0.5; // Интенсивность света

				let material = new THREE.MeshPhongMaterial({
					emissive: emissiveColor,
					emissiveIntensity: intensity,
				});
				let mesh = new THREE.Mesh(textGeometry, material);
				mesh.castShadow = true;
				mesh.receiveShadow = true;
				mesh.rotation.x = -Math.PI / 2;
				mesh.position.x = -0.8;
				mesh.position.y = 0;
				mesh.position.z = 0.4;
				model.add(mesh);
			}
		);
	},
	undefined,
	function (error) {
		console.error(error);
	}
);

let isModelMouseDown = false;
let onModelMouseDownPosition = new THREE.Vector2();
function onModelMouseDown(event) {
	event.preventDefault();
	isModelMouseDown = true;
	onModelMouseDownPosition.x = event.clientX;
	onModelMouseDownPosition.y = event.clientY;
}
function onModelMouseMove(event) {
	if (!isModelMouseDown || !model) {
		return;
	}
	event.preventDefault();
	let moveX = event.clientX - onModelMouseDownPosition.x;
	let moveY = event.clientY - onModelMouseDownPosition.y;
	let raycaster = new THREE.Raycaster();
	let mouse = new THREE.Vector2();
	mouse.x = (event.clientX / renderWidth) * 2 - 1;
	mouse.y = -(event.clientY / renderHeight) * 2 + 1;
	raycaster.setFromCamera(mouse, camera);
	let intersects = raycaster.intersectObject(model, true);
	if (intersects.length > 0) {
		model.rotation.y += moveX * 0.01;
		model.rotation.x += moveY * 0.01;
	}
	onModelMouseDownPosition.x = event.clientX;
	onModelMouseDownPosition.y = event.clientY;
}
function onModelMouseUp(event) {
	event.preventDefault();
	isModelMouseDown = false;
	let raycaster = new THREE.Raycaster();
	let mouse = new THREE.Vector2();
	mouse.x = (event.clientX / renderWidth) * 2 - 1;
	mouse.y = -(event.clientY / renderHeight) * 2 + 1;
	raycaster.setFromCamera(mouse, camera);
	let intersects = raycaster.intersectObject(model, true);
}
renderer.domElement.addEventListener('mousedown', onModelMouseDown, false);
renderer.domElement.addEventListener('mousemove', onModelMouseMove, false);
renderer.domElement.addEventListener('mouseup', onModelMouseUp, false);
renderer.domElement.addEventListener('touchstart', onModelMouseDown);
renderer.domElement.addEventListener('touchmove', onModelMouseMove);
renderer.domElement.addEventListener('touchend', onModelMouseUp);
let button = document.getElementById('myButton');
let positions = [
	new THREE.Vector3(3, 3, -8),
	new THREE.Vector3(3, 3, -8),
	new THREE.Vector3(1.7, -1.3, -5),
];
let currentPositionIndex = 0;
let isAnimating = false;
button.addEventListener('click', function () {
	if (!isAnimating) {
		animateModel();
	}
});
function animateModel() {
	isAnimating = true;
	let targetPosition = positions[currentPositionIndex];
	let distance = model.position.distanceTo(targetPosition);
	let speed = 0.09;
	if (distance > 0.1) {
		let direction = new THREE.Vector3().subVectors(targetPosition, model.position).normalize();
		let moveAmount = direction.multiplyScalar(speed);
		model.position.add(moveAmount);
	} else {
		currentPositionIndex++;
		if (currentPositionIndex >= positions.length) {
			let targetRotation = 1.5;
			let targetOpacity = 0.5;
			let rotationSpeed = 0.01; // Скорость вращения
			let opacitySpeed = 0.01; // Скорость изменения прозрачности

			function animate() {
				if (
					Math.abs(model.rotation.x - targetRotation) > rotationSpeed ||
					Math.abs(material.opacity - targetOpacity) > opacitySpeed
				) {
					requestAnimationFrame(animate);
				}
				// Плавное вращение
				if (Math.abs(model.rotation.x - targetRotation) > rotationSpeed) {
					model.rotation.x += model.rotation.x < targetRotation ? rotationSpeed : -rotationSpeed;
				}
				// Плавное изменение прозрачности
				if (Math.abs(material.opacity - targetOpacity) > opacitySpeed) {
					material.opacity += material.opacity < targetOpacity ? opacitySpeed : -opacitySpeed;
					material.needsUpdate = true;
				}

				// Проверка условия
				if (currentPositionIndex >= positions.length) {
					currentPositionIndex = 0;
					isAnimating = false;
					material.transparent = true;
				}
			}

			// Запуск анимации
			animate();

			return;
		}
	}
	if (distance > 0.001) {
		requestAnimationFrame(animateModel);
	} else {
		isAnimating = false;
	}
}

function animate() {
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
}
animate();
let isTransparent = true;

function toggleOpacity() {
	isTransparent = !isTransparent;
	material.transparent = isTransparent;
	material.opacity = isTransparent ? 0.5 : 1;
	material.needsUpdate = true;
	// При загрузке страницы скрываем вторую линию
}
toggleOpacity();
let button2 = document.getElementById('myButton2');
button2.addEventListener('click', toggleOpacity);
