// Configuration du canvas et du contexte
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Fonction pour redimensionner le canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  borders.right = canvas.width;
  borders.bottom = canvas.height;
}

// Redimensionner le canvas lors du chargement de la page et lorsque la fenêtre est redimensionnée
window.addEventListener("load", resizeCanvas);
window.addEventListener("resize", resizeCanvas);

// Variables de jeu
let score = 0;
let level = 1;
let bestScore = 0;
const flowerCount = 5;
const baseObstacleCount = 3; // Nombre de base d'obstacles
let ladybug;
let flowers = [];
let obstacles = [];
const borders = { top: 0, left: 0, right: canvas.width, bottom: canvas.height };

// Clés directionnelles
let keysPressed = {};

// Coccinelle
class Ladybug {
  constructor() {
    this.width = 50;
    this.height = 50;
    this.x = 100;
    this.y = 100;
    this.speed = 5;
    this.image = new Image();
    this.image.src = "images/ladybug.png"; // Charger l'image de la coccinelle
  }

  draw() {
    ctx.drawImage(
      this.image,
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );
  }

  move() {
    if (keysPressed["ArrowUp"] || keysPressed["up"]) this.y -= this.speed;
    if (keysPressed["ArrowDown"] || keysPressed["down"]) this.y += this.speed;
    if (keysPressed["ArrowLeft"] || keysPressed["left"]) this.x -= this.speed;
    if (keysPressed["ArrowRight"] || keysPressed["right"]) this.x += this.speed;

    // Wrap-around logic
    if (this.x < 0) {
      this.x = canvas.width;
    } else if (this.x > canvas.width) {
      this.x = 0;
    }

    if (this.y < 0) {
      this.y = canvas.height;
    } else if (this.y > canvas.height) {
      this.y = 0;
    }
  }
}

// Fleur
class Flower {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 50; // Agrandir la taille des fleurs
    this.image = new Image();
    this.image.src = "images/fleurs.png"; // Charger l'image de la fleur
  }

  draw() {
    ctx.drawImage(
      this.image,
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    );
  }

  isCollected(ladybug) {
    const distance = Math.hypot(ladybug.x - this.x, ladybug.y - this.y);
    return distance < this.size / 2 + 25;
  }
}

// Obstacle
class Obstacle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 40;
    this.image = new Image();
    this.image.src = "images/rock.png"; // Charger l'image de l'obstacle
    this.speedX = Math.random() * 2 - 1; // Mouvement horizontal
    this.speedY = Math.random() * 2 - 1; // Mouvement vertical
  }

  draw() {
    ctx.drawImage(
      this.image,
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size
    );
  }

  isColliding(ladybug) {
    return (
      ladybug.x + 25 > this.x - this.size / 2 &&
      ladybug.x - 25 < this.x + this.size / 2 &&
      ladybug.y + 25 > this.y - this.size / 2 &&
      ladybug.y - 25 < this.y + this.size / 2
    );
  }

  move() {
    // Déplacer les obstacles à partir du niveau 3 et si une touche est pressée
    if (level >= 3 && Object.keys(keysPressed).length > 0) {
      this.x += this.speedX;
      this.y += this.speedY;

      // Empêcher les obstacles de sortir du canvas
      if (this.x < 0 || this.x > canvas.width) this.speedX = -this.speedX;
      if (this.y < 0 || this.y > canvas.height) this.speedY = -this.speedY;
    }
  }
}

// Vérifier les chevauchements
function isOverlapping(x, y, size, items) {
  return items.some((item) => {
    const distance = Math.hypot(x - item.x, y - item.y);
    return distance < size / 2 + item.size / 2;
  });
}

// Initialiser le jeu
function initGame() {
  ladybug = new Ladybug();
  flowers = [];
  obstacles = [];

  // Créer des fleurs
  for (let i = 0; i < flowerCount; i++) {
    let x, y;
    do {
      x = Math.random() * (canvas.width - 50) + 50;
      y = Math.random() * (canvas.height - 50) + 50;
    } while (isOverlapping(x, y, 50, obstacles)); // Vérifier les chevauchements avec les obstacles
    flowers.push(new Flower(x, y));
  }

  // Créer des obstacles
  const obstacleCount = baseObstacleCount + level - 1; // Ajouter plus d'obstacles à chaque niveau
  for (let i = 0; i < obstacleCount; i++) {
    let x, y;
    do {
      x = Math.random() * (canvas.width - 40) + 40;
      y = Math.random() * (canvas.height - 40) + 40;
    } while (
      isOverlapping(x, y, 40, flowers) ||
      isOverlapping(x, y, 40, [
        { x: ladybug.x, y: ladybug.y, size: ladybug.width },
      ])
    ); // Vérifier les chevauchements avec les fleurs et la coccinelle
    obstacles.push(new Obstacle(x, y));
  }
}

// Dessiner le jeu
function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Effacer le canvas

  // Dessiner la coccinelle
  ladybug.draw();

  // Dessiner les fleurs
  flowers.forEach((flower) => flower.draw());

  // Dessiner les obstacles
  obstacles.forEach((obstacle) => obstacle.draw());

  // Vérifier la collecte des fleurs
  flowers = flowers.filter((flower) => {
    if (flower.isCollected(ladybug)) {
      score += 10;
      updateScore();
      return false;
    }
    return true;
  });

  // Vérifier les collisions avec les obstacles
  obstacles.forEach((obstacle) => {
    if (obstacle.isColliding(ladybug)) {
      alert("Game Over!");
      if (score > bestScore) {
        bestScore = score;
      }
      score = 0;
      level = 1;
      updateScore();
      initGame(); // Redémarrer le jeu
    }
  });

  // Vérifier si le niveau est terminé
  if (flowers.length === 0) {
    level++;
    alert(`Niveau ${level} terminé !`);
    initGame(); // Nouveau niveau
  }

  // Afficher le score et le niveau
  updateScore();
}

// Mettre à jour le score affiché
function updateScore() {
  document.getElementById("scoreValue").textContent = score;
  document.getElementById("levelValue").textContent = level;
  document.getElementById("bestScoreValue").textContent = bestScore;
}

// Boucle principale du jeu
function gameLoop() {
  ladybug.move();
  obstacles.forEach((obstacle) => obstacle.move());
  drawGame();
  requestAnimationFrame(gameLoop); // Redemander à la boucle de se répéter
}

// Écouter les touches du clavier
window.addEventListener("keydown", (e) => {
  // Bloquer le comportement par défaut du navigateur (éviter le défilement de la page avec les flèches)
  e.preventDefault();
  if (e.key === "ArrowUp") {
    keysPressed["up"] = true;
  }
  if (e.key === "ArrowDown") {
    keysPressed["down"] = true;
  }
  if (e.key === "ArrowLeft") {
    keysPressed["left"] = true;
  }
  if (e.key === "ArrowRight") {
    keysPressed["right"] = true;
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowUp") {
    keysPressed["up"] = false;
  }
  if (e.key === "ArrowDown") {
    keysPressed["down"] = false;
  }
  if (e.key === "ArrowLeft") {
    keysPressed["left"] = false;
  }
  if (e.key === "ArrowRight") {
    keysPressed["right"] = false;
  }
});

// Réinitialiser les touches pressées lorsque la fenêtre perd ou gagne le focus
window.addEventListener("blur", () => {
  keysPressed = {};
});

window.addEventListener("focus", () => {
  keysPressed = {};
});

// Écouter les clics sur les flèches directionnelles (boutons)
document
  .getElementById("up")
  .addEventListener("mousedown", () => (keysPressed["up"] = true));
document
  .getElementById("down")
  .addEventListener("mousedown", () => (keysPressed["down"] = true));
document
  .getElementById("left")
  .addEventListener("mousedown", () => (keysPressed["left"] = true));
document
  .getElementById("right")
  .addEventListener("mousedown", () => (keysPressed["right"] = true));

document
  .getElementById("up")
  .addEventListener("mouseup", () => (keysPressed["up"] = false));
document
  .getElementById("down")
  .addEventListener("mouseup", () => (keysPressed["down"] = false));
document
  .getElementById("left")
  .addEventListener("mouseup", () => (keysPressed["left"] = false));
document
  .getElementById("right")
  .addEventListener("mouseup", () => (keysPressed["right"] = false));

// Initialisation et démarrage du jeu
document.getElementById("startGame").addEventListener("click", () => {
  document.getElementById("instructions").style.display = "none";
  initGame();
  gameLoop();
});
