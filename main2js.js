import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// Создание сцены
const scene = new THREE.Scene();

// Настройка камеры
const container = document.getElementById('container');
const containerWidth = container.clientWidth;
const containerHeight = container.clientHeight;

const camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
camera.position.z = 8;

// Настройка рендерера
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(containerWidth, containerHeight);
container.appendChild(renderer.domElement);
renderer.setClearColor(0x2d2d30, 0);

// Настройка освещения
const ambientLight = new THREE.AmbientLight(0x404040, 2); // Мягкий белый свет
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Материалы для коробок
const materials = {
	int: new THREE.MeshPhongMaterial({ color: 0xff9999, shininess: 100 }),
	double: new THREE.MeshPhongMaterial({ color: 0x99ff99, shininess: 100 }),
	char: new THREE.MeshPhongMaterial({ color: 0x9999ff, shininess: 100 }),
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

// Raycaster и мышь для взаимодействия
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedBoxForRotation = null;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

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
	textMesh.castShadow = true; // Текст отбрасывает теней
	textMesh.receiveShadow = true; // Текст получает тени

	// Позиция метки над коробкой
	textMesh.position.set(0, 1.5, 0);
	box.add(textMesh);
}

// Функция создания коробок после загрузки шрифта
function createBoxes() {
	loader.load(
		'model/box1.glb', // Убедитесь, что путь к модели корректный
		function (gltf) {
			model = gltf.scene;

			// Масштабирование модели коробки для лучшего отображения
			model.scale.set(1, 1, 1); // Измените масштаб, если модель искажена

			// Создание и настройка каждой коробки
			const positions = [-3, 0, 3]; // x координаты для трех коробок
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

// Функция очистки старых текстов перед новой анимацией
function clearOldTexts() {
	boxes.forEach((box) => {
		box.children.forEach((child) => {
			if (child.isMesh && child.geometry.type === 'TextGeometry') {
				box.remove(child);
				scene.remove(child);
			}
		});
	});
}

animateButton.addEventListener('click', function () {
	if (!isAnimating) {
		animateValuesIntoBoxes();
	}
});

function animateValuesIntoBoxes() {
	// Очистка старых текстов
	clearOldTexts();

	// Получение значений из полей ввода
	const intValue = document.getElementById('intInput').value.trim();
	const doubleValue = document.getElementById('doubleInput').value.trim();
	const charValue = document.getElementById('charInput').value.trim();

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

	// Обновление C++ кода с cout
	updateCppCode(intValue, doubleValue, charValue);
}

// Функция плавного перехода (easing)
function easeInOutQuad(t) {
	return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Функция обновления C++ кода
function updateCppCode(intVal, doubleVal, charVal) {
	const codeBlock = document.querySelector('.code-block');

	const updatedCode = `
<span class="keyword">#include</span> &lt;iostream&gt;
<span class="keyword">using</span> <span class="keyword">namespace</span> std;

<span class="keyword">int</span> <span class="variable">main</span>() {
    <span class="type">int</span> <span class="variable">myInt</span> = <span class="value">${
			intVal || 0
		}</span>;
    <span class="type">double</span> <span class="variable">myDouble</span> = <span class="value">${
			doubleVal || 0.0
		}</span>;
    <span class="type">char</span> <span class="variable">myChar</span> = <span class="value">'${
			charVal || 'A'
		}'</span>;

    <span class="keyword">cout</span> &lt;&lt; <span class="value">"myInt: "</span> &lt;&lt; myInt &lt;&lt; <span class="value">"\\n"</span> &lt;&lt; <span class="operator">endl</span>;<br>
    <span class="keyword">cout</span> &lt;&lt; <span class="value">"myDouble: "</span> &lt;&lt; myDouble &lt;&lt; <span class="value">"\\n"</span> &lt;&lt; <span class="operator">endl</span>;<br>
    <span class="keyword">cout</span> &lt;&lt; <span class="value">"myChar: "</span> &lt;&lt; myChar &lt;&lt; <span class="value">"\\n"</span> &lt;&lt; <span class="operator">endl</span>;<br><br>
    <span class="keyword">return</span> <span class="value">0</span>;
}
    `;

	codeBlock.innerHTML = updatedCode;
}

// Вращение коробок
// Добавим Raycaster для выбора коробки и вращения её отдельно
renderer.domElement.addEventListener('mousedown', onMouseDown, false);
renderer.domElement.addEventListener('mousemove', onMouseMove, false);
renderer.domElement.addEventListener('mouseup', onMouseUp, false);

function onMouseDown(event) {
	isDragging = true;

	// Получение позиции мыши
	const rect = renderer.domElement.getBoundingClientRect();
	mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
	mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

	// Обновление Raycaster
	raycaster.setFromCamera(mouse, camera);

	// Определение пересечений
	const intersects = raycaster.intersectObjects(boxes, true);

	if (intersects.length > 0) {
		selectedBoxForRotation = intersects[0].object.parent;
	}

	previousMousePosition = {
		x: event.clientX,
		y: event.clientY,
	};
}

function onMouseMove(event) {
	if (!isDragging || !selectedBoxForRotation) return;

	const deltaMove = {
		x: event.clientX - previousMousePosition.x,
		y: event.clientY - previousMousePosition.y,
	};

	// Вращение коробки
	selectedBoxForRotation.rotation.y += deltaMove.x * 0.005;
	selectedBoxForRotation.rotation.x += deltaMove.y * 0.005;

	previousMousePosition = {
		x: event.clientX,
		y: event.clientY,
	};
}

function onMouseUp(event) {
	isDragging = false;
	selectedBoxForRotation = null;
}
