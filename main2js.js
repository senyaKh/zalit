import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// Создание сцены
let scene = new THREE.Scene();

// Настройка камеры
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;

// Настройка рендерера с поддержкой теней
let renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

renderer.setClearColor(0x2d2d30, 0);
renderer.shadowMap.enabled = true; // Включение теней
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Тип теней (опционально)

// Добавление источника света с отбрасыванием теней
let pointLight = new THREE.PointLight(0xffffff, 2); // Интенсивность 2
pointLight.position.set(5, 5, 5); // Перемещён для лучшего освещения
pointLight.castShadow = true; // Отбрасывание теней
pointLight.shadow.mapSize.width = 1024; // Разрешение теней
pointLight.shadow.mapSize.height = 1024;
pointLight.shadow.camera.near = 0.5;
pointLight.shadow.camera.far = 500;
scene.add(pointLight);

// Добавление DirectionalLight для более равномерного освещения
let directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Интенсивность 1.5
directionalLight.position.set(-5, 5, -5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
scene.add(directionalLight);

// Добавление HemisphereLight для мягкого освещения неба и земли
let hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x444444, 0.6);
hemisphereLight.position.set(0, 20, 0);
scene.add(hemisphereLight);

// Добавление дополнительного света для лучшей видимости
let ambientLight = new THREE.AmbientLight(0x909090); // Увеличен цвет для яркости
scene.add(ambientLight);

// Создание материалов с поддержкой теней
let materials = [
	new THREE.MeshPhongMaterial({ color: 0xff9999, shininess: 100 }), // Пастельный розовый для int
	new THREE.MeshPhongMaterial({ color: 0x99ff99, shininess: 100 }), // Пастельный зеленый для double
	new THREE.MeshPhongMaterial({ color: 0x9999ff, shininess: 100 }), // Пастельный синий для char
];

// Загрузка модели коробки
let loader = new GLTFLoader();
let model;

// Массив для хранения всех коробок
let boxes = [];

// Настройка Raycaster и переменных для вращения
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let selectedBox = null;
let isMouseDown = false;
let startMousePos = { x: 0, y: 0 };

// Массив для хранения текстовых объектов внутри коробок
let textObjects = [];

// Функция очистки старых текстов перед новой анимацией
function clearOldTexts() {
	textObjects.forEach((text) => {
		if (text.parent) {
			text.parent.remove(text);
		}
		scene.remove(text);
	});
	textObjects = [];
}

// Загрузка и настройка коробок
loader.load(
	'model/box1.glb',
	function (gltf) {
		model = gltf.scene;

		// Масштабирование модели коробки для лучшего отображения
		model.scale.set(1, 1, 1);

		// Создание и настройка каждой коробки
		const positions = [-3, 0, 3]; // x координаты для трех коробок
		const labels = ['int', 'double', 'char'];

		positions.forEach((pos, index) => {
			let box = model.clone();
			box.position.set(pos, 0, 0);
			applyMaterial(box, materials[index]);
			box.castShadow = true; // Коробка отбрасывает тени
			box.receiveShadow = true; // Коробка получает тени
			scene.add(box);
			addLabel(labels[index], box);
			boxes.push(box); // Добавляем коробку в массив
		});
	},
	undefined,
	function (error) {
		console.error(error);
	}
);

// Функция для применения материала к каждой коробке
function applyMaterial(box, material) {
	box.traverse(function (node) {
		if (node.isMesh) {
			node.material = material;
			node.castShadow = true; // Отбрасывание теней
			node.receiveShadow = true; // Получение теней
		}
	});
}

// Функция для добавления метки (тип переменной) над коробкой
function addLabel(value, box) {
	const fontLoader = new FontLoader();
	fontLoader.load(
		'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
		function (font) {
			const textGeometry = new TextGeometry(value, {
				font: font,
				size: 0.5,
				height: 0.05,
				curveSegments: 12,
				bevelEnabled: true,
				bevelThickness: 0.01,
				bevelSize: 0.01,
				bevelOffset: 0,
				bevelSegments: 3,
			});

			// Центрирование геометрии текста
			textGeometry.computeBoundingBox();
			const center = textGeometry.boundingBox.getCenter(new THREE.Vector3());
			textGeometry.translate(-center.x, -center.y, -center.z);

			let textMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
			let textMesh = new THREE.Mesh(textGeometry, textMaterial);
			textMesh.castShadow = true; // Текст отбрасывает тени
			textMesh.receiveShadow = true; // Текст получает тени

			// Позиция метки над коробкой
			textMesh.position.set(0, 1.5, 0);
			box.add(textMesh);
		}
	);
}

// Обработчики событий для вращения коробок
renderer.domElement.addEventListener('mousedown', onMouseDown, false);
renderer.domElement.addEventListener('mousemove', onMouseMove, false);
renderer.domElement.addEventListener('mouseup', onMouseUp, false);

// Функция обработки нажатия мыши
function onMouseDown(event) {
	event.preventDefault();

	// Получение позиции мыши
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

	// Обновление Raycaster
	raycaster.setFromCamera(mouse, camera);

	// Проверка пересечения с коробками
	let intersects = raycaster.intersectObjects(boxes, true);

	if (intersects.length > 0) {
		selectedBox = intersects[0].object.parent; // Выбираем родительский объект (коробку)
		isMouseDown = true;
		startMousePos = { x: event.clientX, y: event.clientY };
	}
}

// Функция обработки движения мыши
function onMouseMove(event) {
	if (!isMouseDown || !selectedBox) return;

	let deltaMove = { x: event.clientX - startMousePos.x, y: event.clientY - startMousePos.y };
	selectedBox.rotation.y += deltaMove.x * 0.005;
	selectedBox.rotation.x += deltaMove.y * 0.005;
	startMousePos = { x: event.clientX, y: event.clientY };
}

// Функция обработки отпускания мыши
function onMouseUp() {
	isMouseDown = false;
	selectedBox = null;
}

// Анимация сцены
function animate() {
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
}
animate();

// Кнопка изменения прозрачности
let isTransparent = true;

function toggleOpacity() {
	isTransparent = !isTransparent;
	materials.forEach((material) => {
		material.transparent = isTransparent;
		material.opacity = isTransparent ? 0.5 : 1;
		material.needsUpdate = true;
	});
}

let button2 = document.getElementById('myButton2');
button2.addEventListener('click', toggleOpacity);

// Кнопка запуска анимации перемещения значений
let animateButton = document.getElementById('animateButton');
let isAnimating = false;

// Функция запуска анимации перемещения значений в коробки
animateButton.addEventListener('click', function () {
	if (!isAnimating) {
		animateValuesIntoBoxes();
	}
});

function animateValuesIntoBoxes() {
	// Очистка старых текстов
	clearOldTexts();

	// Получение значений из полей ввода
	let intValue = document.getElementById('intValue').value.trim();
	let doubleValue = document.getElementById('doubleValue').value.trim();
	let charValue = document.getElementById('charValue').value.trim();

	// Валидация ввода
	if (intValue && !Number.isInteger(Number(intValue))) {
		alert('Введите корректное целое число для int.');
		return;
	}

	if (doubleValue && isNaN(Number(doubleValue))) {
		alert('Введите корректное число с плавающей запятой для double.');
		return;
	}

	if (charValue && charValue.length !== 1) {
		alert('Введите только один символ для char.');
		return;
	}

	// Создание массива с данными
	let values = [
		{ type: 'int', value: intValue, box: boxes[0] },
		{ type: 'double', value: doubleValue, box: boxes[1] },
		{ type: 'char', value: charValue, box: boxes[2] },
	];

	// Загрузка шрифта
	const fontLoader = new FontLoader();
	fontLoader.load(
		'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
		function (font) {
			values.forEach((item, index) => {
				if (item.value) {
					// Создание геометрии текста
					const textGeometry = new TextGeometry(item.value, {
						font: font,
						size: 0.5,
						height: 0.05,
						curveSegments: 12,
						bevelEnabled: true,
						bevelThickness: 0.01,
						bevelSize: 0.01,
						bevelOffset: 0,
						bevelSegments: 3,
					});

					// Центрирование геометрии текста
					textGeometry.computeBoundingBox();
					const center = textGeometry.boundingBox.getCenter(new THREE.Vector3());
					textGeometry.translate(-center.x, -center.y, -center.z);

					// Создание материала для текста
					let textMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

					// Создание меша текста
					let textMesh = new THREE.Mesh(textGeometry, textMaterial);
					textMesh.castShadow = true;
					textMesh.receiveShadow = true;

					// Установка начальной позиции текста (сверху камеры)
					// Позиция начала анимации
					let startPosition = new THREE.Vector3(0, 2, 5); // Над камерой

					textMesh.position.copy(startPosition);

					scene.add(textMesh);
					textObjects.push(textMesh);

					// Целевая позиция текста внутри коробки
					let targetPosition = new THREE.Vector3(0, 0.3, 0); // Центр коробки

					// Определение конечной позиции в глобальных координатах
					let boxWorldPosition = new THREE.Vector3();
					item.box.getWorldPosition(boxWorldPosition);
					let targetWorldPosition = boxWorldPosition.clone().add(targetPosition);

					// Анимация перемещения текста из startPosition в targetWorldPosition
					let duration = 1000; // Время анимации в миллисекундах
					let startTime = performance.now();

					function animateText() {
						let currentTime = performance.now();
						let elapsed = currentTime - startTime;
						let progress = Math.min(elapsed / duration, 1); // Ограничение до 1

						// Интерполяция позиции с плавным переходом
						textMesh.position.lerpVectors(
							startPosition,
							targetWorldPosition,
							easeInOutQuad(progress)
						);

						if (progress < 1) {
							requestAnimationFrame(animateText);
						} else {
							// Завершение анимации
							textMesh.position.copy(targetWorldPosition);

							// Привязка текста к коробке
							item.box.add(textMesh);
							textMesh.position.set(targetPosition.x, targetPosition.y, targetPosition.z);

							isAnimating = false;
						}
					}

					isAnimating = true;
					animateText();
				}
			});
		}
	);
}

// Функция плавного перехода (easing)
function easeInOutQuad(t) {
	return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Удаление неиспользуемого кода animateModel и любых ссылок на нее

// Функция преобразования 2D координат в 3D (не используется, можно удалить или оставить пустой)
function convert2DTo3D(x, y) {
	// Не используется
	return new THREE.Vector3(model.position.x, model.position.y, model.position.z);
}

// Обработка изменения размера окна
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}
