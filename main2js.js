import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

let renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

renderer.setClearColor(0x2d2d30, 0);
renderer.shadowMap.enabled = true;

let loader = new GLTFLoader();
let light = new THREE.PointLight(0xffffff, 1);
light.position.set(1, 1, 1);
light.castShadow = true;
scene.add(light);

let material = new THREE.MeshBasicMaterial({ color: 0x8690e4 });
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
		model.scale.set(0.3, 0.3, 0.3);
		// Начальная позиция будет привязана к элементу boxPosition через преобразование в 3D
		let boxStartElement = document.getElementById('boxPosition').getBoundingClientRect();
		let startVector3D = convert2DTo3D(boxStartElement.left, boxStartElement.top);
		model.position.copy(startVector3D);
		model.rotation.x = 1.5;
		model.rotation.y = 0.2;
		model.rotation.z = -0.3;
		scene.add(model);

		const fontLoader = new FontLoader();
		fontLoader.load(
			'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
			function (font) {
				const textGeometry = new TextGeometry('12', {
					font: font,
					size: 1,
					height: 0.2,
					curveSegments: 12,
					bevelEnabled: true,
					bevelThickness: 0.03,
					bevelSize: 0.02,
					bevelOffset: 0,
					bevelSegments: 5,
				});

				let emissiveColor = new THREE.Color(0xfffff);
				let intensity = 0.5;

				let textMaterial = new THREE.MeshPhongMaterial({
					emissive: emissiveColor,
					emissiveIntensity: intensity,
				});
				let mesh = new THREE.Mesh(textGeometry, textMaterial);
				mesh.castShadow = true;
				mesh.receiveShadow = true;
				mesh.rotation.x = -Math.PI / 2;
				mesh.position.set(-0.9, -0.9, 0.5);
				model.add(mesh);

				// // Создаем GUI только после загрузки модели
				// createGUI(model);
			}
		);
	},
	undefined,
	function (error) {
		console.error(error);
	}
);

// Функция для преобразования 2D координат в 3D пространство
function convert2DTo3D(x, y) {
	let vector = new THREE.Vector3(
		(x / window.innerWidth) * 2 - 0.9,
		-(y / window.innerHeight) * 2 + 0.9,
		0.5
	);
	vector.unproject(camera);
	let dir = vector.sub(camera.position).normalize();
	let distance = -camera.position.z / dir.z;
	let pos = camera.position.clone().add(dir.multiplyScalar(distance));
	return pos;
}

// Создание GUI
// function createGUI(model) {
// 	const gui = new GUI();
// 	const modelFolder = gui.addFolder('Model Controls');
// 	modelFolder.add(model.rotation, 'x', -Math.PI, Math.PI).name('Rotation X');
// 	modelFolder.add(model.rotation, 'y', -Math.PI, Math.PI).name('Rotation Y');
// 	modelFolder.add(model.rotation, 'z', -Math.PI, Math.PI).name('Rotation Z');
// 	modelFolder.open();
// }

// Управление вращением модели на мыши и мобильных устройствах
let isModelMouseDown = false;
let onModelMouseDownPosition = new THREE.Vector2();

function onModelMouseDown(event) {
	event.preventDefault();
	isModelMouseDown = true;
	onModelMouseDownPosition.set(
		event.clientX || event.touches[0].clientX,
		event.clientY || event.touches[0].clientY
	);
}

function onModelMouseMove(event) {
	if (!isModelMouseDown || !model) return;

	let moveX = (event.clientX || event.touches[0].clientX) - onModelMouseDownPosition.x;
	let moveY = (event.clientY || event.touches[0].clientY) - onModelMouseDownPosition.y;

	model.rotation.y += moveX * 0.01;
	model.rotation.x += moveY * 0.01;

	onModelMouseDownPosition.set(
		event.clientX || event.touches[0].clientX,
		event.clientY || event.touches[0].clientY
	);
}

function onModelMouseUp() {
	isModelMouseDown = false;
}

renderer.domElement.addEventListener('mousedown', onModelMouseDown);
renderer.domElement.addEventListener('mousemove', onModelMouseMove);
renderer.domElement.addEventListener('mouseup', onModelMouseUp);
renderer.domElement.addEventListener('touchstart', onModelMouseDown);
renderer.domElement.addEventListener('touchmove', onModelMouseMove);
renderer.domElement.addEventListener('touchend', onModelMouseUp);

// Анимация
function animate() {
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
}

animate();

// Адаптивность на изменение размера экрана
window.addEventListener('resize', () => {
	let width = window.innerWidth;
	let height = window.innerHeight;
	renderer.setSize(width, height);
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
});

// Кнопка изменения прозрачности
let isTransparent = true;

function toggleOpacity() {
	isTransparent = !isTransparent;
	material.transparent = isTransparent;
	material.opacity = isTransparent ? 0.5 : 1;
	material.needsUpdate = true;
}

let button2 = document.getElementById('myButton2');
button2.addEventListener('click', toggleOpacity);

// Кнопка запуска анимации
let button = document.getElementById('myButton');
let isAnimating = false;

button.addEventListener('click', function () {
	if (!isAnimating) {
		animateModel();
	}
});

function animateModel() {
	let boxEndElement = document.getElementById('boxEndPosition').getBoundingClientRect();
	let targetPosition = convert2DTo3D(boxEndElement.left, boxEndElement.top);

	// Используем кривую Безье для плавного перемещения
	let curve = new THREE.CubicBezierCurve3(
		new THREE.Vector3(model.position.x, model.position.y, model.position.z),
		new THREE.Vector3(model.position.x + 3, model.position.y + 3, model.position.z),
		new THREE.Vector3(targetPosition.x - 3, targetPosition.y - 3, targetPosition.z),
		targetPosition
	);

	let points = curve.getPoints(50);
	let index = 0;

	function moveAlongCurve() {
		if (index < points.length) {
			model.position.set(points[index].x, points[index].y, points[index].z);
			index++;
			requestAnimationFrame(moveAlongCurve);
		} else {
			model.rotation.x = 1.5;
			model.rotation.y = 0.0125;
			model.rotation.z = 0.4;
			isAnimating = false;
		}
	}

	if (!isAnimating) {
		isAnimating = true;
		moveAlongCurve();
	}
}
