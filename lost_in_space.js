"use strict";

// création des constantes du jeu
const ALIEN_BASE_VX = 30;
const ALIEN_BASE_VY = 15;
const ALIEN_NUMBER = 100;
const PLAYER_BASE_VX = 50;
const PLAYER_BASE_VY = 50;

class Game { // classe du jeu
    constructor(canvas) {
        this.canvas = canvas;
        // Code des touches des flèches (Javascripts event.key)
        this.movementKeys = {
            "ArrowLeft": false,
            "ArrowRight": false,
            "ArrowUp": false,
            "ArrowDown": false
        };

        this.bullets = [];
        this.aliens = [];
        this.player = new Player(this.canvas.width / 2, this.canvas.height, PLAYER_BASE_VX, PLAYER_BASE_VY);
        // création du tableau d'aliens
        for (let i = 0; i < ALIEN_NUMBER; i++) {
            this.aliens.push(this.createAlien());
        }
        // initialisation du temps utilisé pour les vitesses 
        let date = new Date();
        this.lastTime = date.getTime();

        // on met this dans self parce que dans addEventListener this est pour window
        let self = this;
        window.addEventListener('keydown', (e) => self.keydown(e));
        window.addEventListener('keyup', (e) => self.keyup(e));

        // boucle du jeu
        this.interval = window.setInterval(() => self.play(), 20);
    }

    play() {
        this.movement(); // on déplace les objets 

        if (this.player.alive) { // si le joueur est vivant alors on dessine 
            this.draw();
        } else {
            // Mort
            window.clearInterval(this.interval);
            let context = this.canvas.getContext("2d");
            context.strokeStyle = "red";
            context.fillStyle = "red";
            context.font = "40px Arial";
            context.strokeText("perdu", 20, 50);
        }
        if (this.player.alive) {
            if (this.winGame(this.aliens)) {
                window.clearInterval(this.interval);
                let context = this.canvas.getContext("2d");
                context.strokeStyle = "red";
                context.fillStyle = "red";
                context.font = "40px Arial";
                context.textAlign = "center";
                context.strokeText("Win", 300, 300);
            }
        }
    }

    movement() {
        // Calcul du temps écoulé depuis le dernier tour
        let date = new Date();
        let timeLapse = (date.getTime() - this.lastTime) / 1000;
        this.lastTime = date.getTime();

        if (this.player.alive) {
            // si le joueur est en collision avec une balle ou un alien on arrete
            if (this.player.collide(this.bullets) || this.player.collide(this.aliens)) {
                return;
            }
            this.player.movement(this.canvas, timeLapse, this.movementKeys);
        }

        for (let i in this.aliens) {
            let alien = this.aliens[i];
            if (!alien.alive) {
                continue; // prochain alien 
            }
            alien.collide(this.bullets);
            if (alien.alive) { // si l'alien est toujours vivant (pas de collision avec une balle)
                alien.movement(this.canvas, timeLapse);
            }
        }

        for (let i in this.bullets) {
            let bullet = this.bullets[i];
            if (bullet.alive) {
                bullet.movement(this.canvas, timeLapse);
            } else { // si la balle a touché un alien alors on la retire du tableau des balles 
                this.bullets.splice(this.bullets.indexOf(bullet), 1);
            }
        }
    }

    draw() {
        let context = this.canvas.getContext("2d");
        // on nettoie la fenetre 
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.player.alive) {
            this.player.draw(context);
        }

        this.aliens.forEach(function(alien) {
            if (alien.alive) {
                alien.draw(context);
            }
        });
        this.bullets.forEach(function(bullet) {
            if (bullet.alive) {
                bullet.draw(context);
            }
        });
    }

    keydown(event) { // on presse la touche
        if (event.key in this.movementKeys) { // si on deplace le joueur 
            this.movementKeys[event.key] = true;
        } else if (event.code == "Space" && this.player.alive) {
            this.bullets.push(this.player.shoot());
        }
    }

    keyup(event) { // on relache la touche 
        if (event.key in this.movementKeys) {
            this.movementKeys[event.key] = false;
        }
    }

    randomInt(min, max) {
        // fait un nombre aleatoire entre deux bornes
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    createAlien() {
        let x = this.randomInt(0, this.canvas.width); // position aléatoire en x
        let y = this.randomInt(0, this.canvas.height - 100); // position aléatoire en y (pas dans le joueur )
        let speed = (x < this.canvas.width / 2) ? ALIEN_BASE_VX : -ALIEN_BASE_VX;

        return new Alien(x, y, speed, ALIEN_BASE_VY);
    }

    winGame(aliens) {
        for (let i = 0; i < aliens.length; i++) {
            if (aliens[i].alive) {
                return false; // prochain alien 
            }
        }
        return true;
    }
}

// Classe qui contient les choses communes à tous les objets mobiles dans le jeu
class Mobile {
    constructor(x, y, vx, vy, size, color) {
            this.alive = true;
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.size = size;
            this.color = color;
        }
        // fonctions en commun (par défaut)
    draw(canvas) {}
    movement(canvas, timeLapse) {}

    getRectangle() { // rectangle dans lequel est contenu l'objet (collisions)
        return { tx: this.x - this.size, ty: this.y, bx: this.x + this.size, by: this.y + this.size };
    }

    singleCollide(other) {
        if (!this.alive) {
            // s'il est mort alors pas de collision
            return false;
        }
        // on prend des rectangles autour des objets
        let myRect = this.getRectangle();
        let otherRect = other.getRectangle();

        let result = (myRect.tx < otherRect.bx &&
            myRect.bx > otherRect.tx &&
            myRect.ty < otherRect.by &&
            myRect.by > otherRect.ty);

        if (result) {
            this.alive = false;
            other.alive = false;
        }

        return result;
    }

    collide(others) {
        if (!this.alive) {
            return false;
        }


        //On s'arrête à la première collision
        //qui détruit les deux objets
        for (let i in others) {
            if (!others[i].alive) {
                continue;
            }
            if (this.singleCollide(others[i])) {
                return true;
            }
        }
        return false;
    }

}

class Alien extends Mobile {
    constructor(x, y, vx, vy) {
        super(x, y, vx, vy, 5, "green"); // taille de 5 parce que sinon ils sont trop petit
    }

    draw(context) {
        context.strokeStyle = this.color;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(this.x - this.size, this.y);
        context.lineTo(this.x, this.y + this.size);
        context.lineTo(this.x + this.size, this.y);
        context.fillStyle = this.color;
        context.fill();
        context.stroke();
        context.closePath();
    }

    movement(canvas, timeLapse) {
        this.x += this.vx * timeLapse; // x + vitesse
        this.y += this.vy * timeLapse;

        let r = this.getRectangle(); // rectangle pour les collisons sur les bords

        // côté droit
        if ((r.tx > canvas.width || r.bx > canvas.width) && this.vx > 0) {
            this.vx *= -1;
        }
        // côté gauche 
        else if ((r.tx < 0 || r.bx < 0) && this.vx < 0) {
            this.vx *= -1;
        }

        // bas
        if ((r.ty > canvas.height || r.by > canvas.height) && this.vy > 0) {
            this.vy *= -1.1;
        }
        //haut
        else if ((r.ty < 0 || r.by < 0) && this.vy < 0) {
            this.vy *= -1.1;
        }
    }
}

class Player extends Mobile {
    constructor(x, y, vx, vy) {
        super(x, y, vx, vy, 10, "orange"); // le vaisseau est de fois plus grand que les monstres
    }

    movement(canvas, timeLapse, keys) {
        let r = this.getRectangle();
        let movX = this.vx * timeLapse;
        let movY = this.vy * timeLapse;

        if (keys.ArrowLeft || keys.ArrowRight) {
            // on ne doit pas presser deu touches opposé au meme moment 
            if (keys.ArrowLeft && !keys.ArrowRight && r.tx > 0) {
                this.x = Math.max(0, this.x - movX);
            } else if (keys.ArrowRight && !keys.ArrowLeft && r.bx < canvas.width) {
                this.x = Math.min(canvas.width, this.x + movX);
            }
        }

        if (keys.ArrowUp || keys.ArrowDown) {
            // on ne doit pas presser deu touches opposé au meme moment 
            if (keys.ArrowUp && !keys.ArrowDown && r.ty > 0) {
                this.y = Math.max(0, this.y - movY);
            } else if (keys.ArrowDown && !keys.ArrowUp && r.by < canvas.height) {
                this.y = Math.min(canvas.height, this.y + movY);
            }
        }
    }

    draw(context) {
        context.strokeStyle = this.color;
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(this.x - this.size, this.y);
        context.lineTo(this.x, this.y - this.size);
        context.lineTo(this.x + this.size, this.y);
        context.fillStyle = this.color;
        context.fill();
        context.stroke();
        context.closePath();
    }

    shoot() {
        let vy = 2 * this.vy;
        return new Bullet(this.x, this.y - this.size - 5, vy);
    }
    getRectangle() {
        // sa propre méthode puisque le vaiseau est tourné dans le sens opposé aux aliens (triangle vers le haut)
        return { tx: this.x - this.size, ty: this.y - this.size, bx: this.x + this.size, by: this.y };
    }
}

class Bullet extends Mobile {
    constructor(x, y, vy) {
        super(x, y, 0, -vy, 2, "white");
        // on garde la position d'origine pour le parcourt total de la balle 
        this.originY = this.y;
    }

    movement(canvas, timeLapse) {
        this.y += this.vy * timeLapse;
        this.vy = this.vy * 0.997;

        if (this.y < this.originY - (canvas.height / 2)) {
            // elle a parcourut trop d'espace et elle meurt 
            this.alive = false;
        }
    }

    draw(context) {
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fillStyle = this.color;
        context.fill();
        context.closePath();
    }

    getRectangle() {
        // sa propre méthode puisqu c'est un cercle et pas un triangle
        return { tx: this.x - this.size, ty: this.y - this.size, bx: this.x + this.size, by: this.y + this.size };
    }
}

// main
window.onload = function() {
    let canvas = document.getElementById('game_area');

    let myGame = new Game(canvas);
}