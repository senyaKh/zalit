import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// Создание сцены
const scene = new THREE.Scene();

// Настройка камеры
const container = document.getElementById('container');
const containerWidth = container.clientWidth;
const containerHeight = container.clientHeight;
const camera = new THREE.PerspectiveCamera(45, containerWidth / containerHeight, 0.1, 1000);
camera.position.z = 10;

// Настройка рендерера
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(containerWidth, containerHeight);
container.appendChild(renderer.domElement);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x2d2d30, 0);

// Настройка освещения
const ambientLight = new THREE.AmbientLight(0x808080, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Материалы для коробок
const materials = {
	int: new THREE.MeshPhongMaterial({ color: 0x48d1cc, shininess: 100 }),
	double: new THREE.MeshPhongMaterial({ color: 0xb3ff66, shininess: 100 }),
	char: new THREE.MeshPhongMaterial({ color: 0x8690e4, shininess: 1000 }),
};

// Загрузка шрифта
const fontLoader = new FontLoader();
let font;
fontLoader.load(
	'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
	function (loadedFont) {
		font = loadedFont;
		// После загрузки шрифта можно создавать коробки с метками
		createBoxes();
	}
);

// Загрузка модели коробки
const loader = new GLTFLoader();
let model;

// Массив для хранения всех коробок
const boxes = [];

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

// Функция для добавления метки над коробкой
function addLabel(value, box) {
	if (!font) return;
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

	const textMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
	const textMesh = new THREE.Mesh(textGeometry, textMaterial);
	textMesh.castShadow = true; // Текст отбрасывает тени
	textMesh.receiveShadow = true; // Текст получает тени

	// Позиция метки над коробкой
	textMesh.position.set(0, 1.5, 0);
	textMesh.name = 'label'; // Добавляем имя для идентификации
	box.add(textMesh);
}

// Функция создания коробок после загрузки шрифта
function createBoxes() {
	loader.load(
		'model/box1.glb', // Убедитесь, что путь к модели корректный
		function (gltf) {
			model = gltf.scene;

			// Масштабирование модели коробки для лучшего отображения
			model.scale.set(1, 1, 1);

			// Создание и настройка каждой коробки
			const positions = [-3.5, 0, 3.5]; // x координаты для трех коробок
			const labels = ['int', 'double', 'char'];

			labels.forEach((label, index) => {
				const box = model.clone();
				box.position.set(positions[index], 0, 0);
				applyMaterial(box, materials[label]);
				box.castShadow = true; // Коробка отбрасывает тени
				box.receiveShadow = true; // Коробка получает тени
				scene.add(box);
				addLabel(label, box);
				boxes.push(box); // Добавляем коробку в массив
			});
		},
		undefined,
		function (error) {
			console.error(error);
		}
	);
}

// Обработка изменения размера окна
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
	const containerWidth = container.clientWidth;
	const containerHeight = container.clientHeight;

	camera.aspect = containerWidth / containerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(containerWidth, containerHeight);
}

// Анимация сцены
function animate() {
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
}
animate();

// Кнопка изменения прозрачности
let isTransparent = false;

function toggleOpacity() {
	isTransparent = !isTransparent;
	Object.values(materials).forEach((material) => {
		material.transparent = isTransparent;
		material.opacity = isTransparent ? 0.5 : 1;
		material.needsUpdate = true;
	});
}

document.getElementById('toggleOpacityButton').addEventListener('click', toggleOpacity);

// Кнопка запуска анимации перемещения значений
const animateButton = document.getElementById('animateButton');
let isAnimating = false;

// Функция обновления блока кода
function updateCodeBlock(intVal, doubleVal, charVal) {
	// Обновляем значения переменных в коде
	document.getElementById('intValue').innerText = intVal || '0';
	document.getElementById('doubleValue').innerText = doubleVal || '0.0';
	document.getElementById('charValue').innerText = charVal ? `'${charVal}'` : `'A'`;
}

// Функция очистки старых текстов перед новой анимацией
function clearOldTexts() {
	boxes.forEach((box) => {
		box.children.forEach((child) => {
			if (child.isMesh && child.geometry.type === 'TextGeometry' && child.name !== 'label') {
				box.remove(child);
			}
		});
	});
}

animateButton.addEventListener('click', function () {
	if (!isAnimating) {
		// Получение значений из полей ввода
		const intValue = document.getElementById('intInput').value.trim();
		const doubleValue = document.getElementById('doubleInput').value.trim();
		const charValue = document.getElementById('charInput').value.trim();

		// Обновляем блок кода
		updateCodeBlock(intValue, doubleValue, charValue);

		// Запускаем анимацию
		animateValuesIntoBoxes(intValue, doubleValue, charValue);

		// Закрываем меню на мобильных устройствах
		const controls = document.querySelector('.controls');
		controls.classList.remove('open');
	}
});

function animateValuesIntoBoxes(intValue, doubleValue, charValue) {
	// Очистка старых текстов
	clearOldTexts();

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
	const values = [
		{ type: 'int', value: intValue, box: boxes[0] },
		{ type: 'double', value: doubleValue, box: boxes[1] },
		{ type: 'char', value: charValue, box: boxes[2] },
	];

	// Проверка наличия шрифта
	if (!font) {
		alert('Шрифт еще не загружен. Попробуйте еще раз.');
		return;
	}

	values.forEach((item) => {
		if (item.value) {
			// Создание геометрии текста
			const textGeometry = new TextGeometry(item.value.toString(), {
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
			const textMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });

			// Создание меша текста
			const textMesh = new THREE.Mesh(textGeometry, textMaterial);
			textMesh.castShadow = true;
			textMesh.receiveShadow = true;

			// Установка начальной позиции текста (сверху камеры)
			const startPosition = new THREE.Vector3(0, 5, 0); // Над камерой
			textMesh.position.copy(startPosition);

			scene.add(textMesh);

			// Целевая позиция текста внутри коробки
			const targetPosition = new THREE.Vector3(0, 0.3, 0); // Центр коробки

			// Определение конечной позиции в глобальных координатах
			const boxWorldPosition = new THREE.Vector3();
			item.box.getWorldPosition(boxWorldPosition);
			const targetWorldPosition = boxWorldPosition.clone().add(targetPosition);

			// Анимация перемещения текста из startPosition в targetWorldPosition
			const duration = 1000; // Время анимации в миллисекундах
			const startTime = performance.now();

			function animateText() {
				const currentTime = performance.now();
				const elapsed = currentTime - startTime;
				const progress = Math.min(elapsed / duration, 1); // Ограничение до 1

				// Интерполяция позиции с плавным переходом
				textMesh.position.lerpVectors(startPosition, targetWorldPosition, easeInOutQuad(progress));

				if (progress < 1) {
					requestAnimationFrame(animateText);
				} else {
					// Завершение анимации
					textMesh.position.copy(targetWorldPosition);

					// Привязка текста к коробке
					item.box.add(textMesh);
					textMesh.position.copy(targetPosition);

					isAnimating = false;
				}
			}

			isAnimating = true;
			animateText();
		}
	});
}

// Функция плавного перехода (easing)
function easeInOutQuad(t) {
	return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Вращение коробок
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let selectedBox = null;
let isDragging = false;
let previousMousePosition = {
	x: 0,
	y: 0,
};

// Функция для обработки нажатия мыши или касания
function onPointerDown(event) {
	event.preventDefault();

	const rect = renderer.domElement.getBoundingClientRect();

	if (event.touches) {
		mouse.x = ((event.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
		mouse.y = -((event.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
	} else {
		mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
	}

	raycaster.setFromCamera(mouse, camera);

	const intersects = raycaster.intersectObjects(boxes, true);

	if (intersects.length > 0) {
		selectedBox = intersects[0].object.parent;
		isDragging = true;
		if (event.touches) {
			previousMousePosition = {
				x: event.touches[0].clientX,
				y: event.touches[0].clientY,
			};
		} else {
			previousMousePosition = {
				x: event.clientX,
				y: event.clientY,
			};
		}
	}
}

// Функция для обработки движения мыши или касания
function onPointerMove(event) {
	if (!isDragging || !selectedBox) return;

	let deltaMove;
	if (event.touches) {
		deltaMove = {
			x: event.touches[0].clientX - previousMousePosition.x,
			y: event.touches[0].clientY - previousMousePosition.y,
		};
		previousMousePosition = {
			x: event.touches[0].clientX,
			y: event.touches[0].clientY,
		};
	} else {
		deltaMove = {
			x: event.clientX - previousMousePosition.x,
			y: event.clientY - previousMousePosition.y,
		};
		previousMousePosition = {
			x: event.clientX,
			y: event.clientY,
		};
	}

	// Вращение коробки
	selectedBox.rotation.y += deltaMove.x * 0.005;
	selectedBox.rotation.x += deltaMove.y * 0.005;
}

// Функция для обработки отпускания мыши или касания
function onPointerUp(event) {
	isDragging = false;
	selectedBox = null;
}

// Добавление обработчиков событий мыши и сенсорных событий
renderer.domElement.addEventListener('mousedown', onPointerDown, false);
renderer.domElement.addEventListener('mousemove', onPointerMove, false);
renderer.domElement.addEventListener('mouseup', onPointerUp, false);

renderer.domElement.addEventListener('touchstart', onPointerDown, false);
renderer.domElement.addEventListener('touchmove', onPointerMove, false);
renderer.domElement.addEventListener('touchend', onPointerUp, false);

// Обработчик для кнопки меню на мобильных устройствах
document.getElementById('menuToggle').addEventListener('click', function () {
	const controls = document.querySelector('.controls');
	controls.classList.toggle('open');
});
